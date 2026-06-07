import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { EvaluationResponse } from '../entities/evaluation-response.entity';
import { QuestionResponse } from '../entities/question-response.entity';
import { EvaluationResponseStatus } from '../enums/evaluation-response-status.enum';
import { ResponsesService } from '../responses.service';
import { LoggerService } from '../../../common/services/logger.service';
import { SCORING_QUEUE } from '../../queue/queue.constants';
import { ReceiveEvaluationDto } from '../dto/receive-evaluation.dto';
import { SaveDraftDto } from '../dto/save-draft.dto';

type MockRepo<T extends object> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockRepo = <T extends object>(): MockRepo<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
});

const buildReceiveDto = (): ReceiveEvaluationDto =>
  ({
    evaluatedUserId: 'user-1',
    evaluatorUserId: 'evaluator-1',
    evaluatedPersonId: 'person-1',
    surveyId: 'survey-1',
    surveyVersion: 1,
    attempt: 1,
    submittedAt: '2026-06-01T00:00:00.000Z',
    answers: [
      {
        questionId: 'question-1',
        sectionId: 'section-1',
        questionType: 'TEXT',
        textValue: 'answer',
      },
    ],
  }) as ReceiveEvaluationDto;

describe('ResponsesService', () => {
  let service: ResponsesService;
  let responseRepo: MockRepo<EvaluationResponse>;
  let questionResponseRepo: MockRepo<QuestionResponse>;
  let scoringQueue: { add: jest.Mock };
  let logger: { error: jest.Mock };

  beforeEach(async () => {
    responseRepo = mockRepo<EvaluationResponse>();
    questionResponseRepo = mockRepo<QuestionResponse>();
    scoringQueue = { add: jest.fn().mockResolvedValue(undefined) };
    logger = { error: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponsesService,
        { provide: getRepositoryToken(EvaluationResponse), useValue: responseRepo },
        { provide: getRepositoryToken(QuestionResponse), useValue: questionResponseRepo },
        { provide: getQueueToken(SCORING_QUEUE), useValue: scoringQueue },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get<ResponsesService>(ResponsesService);
  });

  describe('receive()', () => {
    it('creates an EvaluationResponse, saves answers and enqueues a scoring job', async () => {
      const dto = buildReceiveDto();
      responseRepo.findOne!.mockResolvedValue(null);
      responseRepo.create!.mockImplementation((data) => data);
      responseRepo.save!.mockResolvedValue({ id: 'response-1', ...dto });
      questionResponseRepo.create!.mockImplementation((data) => data);
      questionResponseRepo.save!.mockResolvedValue([]);

      const result = await service.receive(dto);

      expect(responseRepo.save).toHaveBeenCalledTimes(1);
      expect(questionResponseRepo.save).toHaveBeenCalledTimes(1);
      expect(scoringQueue.add).toHaveBeenCalledWith('process-evaluation-response', {
        responseId: 'response-1',
      });
      expect(result).toEqual({ responseId: 'response-1', status: 'queued' });
    });

    it('is idempotent for a response already PROCESADA with the same attempt', async () => {
      const dto = buildReceiveDto();
      responseRepo.findOne!.mockResolvedValue({
        id: 'existing-response',
        status: EvaluationResponseStatus.PROCESADA,
      });

      const result = await service.receive(dto);

      expect(responseRepo.save).not.toHaveBeenCalled();
      expect(scoringQueue.add).not.toHaveBeenCalled();
      expect(result).toEqual({ responseId: 'existing-response', status: 'queued' });
    });

    it('throws BadRequestException when there are no answers', async () => {
      const dto = { ...buildReceiveDto(), answers: [] };

      await expect(service.receive(dto)).rejects.toThrow(BadRequestException);
      expect(responseRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('saveDraft()', () => {
    const buildDraftDto = (): SaveDraftDto =>
      ({
        evaluatedUserId: 'user-1',
        evaluatorUserId: 'evaluator-1',
        evaluatedPersonId: 'person-1',
        surveyId: 'survey-1',
        surveyVersion: 1,
        attempt: 1,
        answers: [
          {
            questionId: 'question-1',
            sectionId: 'section-1',
            questionType: 'TEXT',
            textValue: 'x',
          },
        ],
      }) as SaveDraftDto;

    it('upserts the draft on a second call with the same evaluatedUserId', async () => {
      const dto = buildDraftDto();
      const existingDraft = { id: 'draft-1', status: EvaluationResponseStatus.BORRADOR };
      responseRepo.findOne!.mockResolvedValue(existingDraft);
      questionResponseRepo.delete!.mockResolvedValue(undefined);
      questionResponseRepo.create!.mockImplementation((data) => data);
      questionResponseRepo.save!.mockResolvedValue([]);

      const result = await service.saveDraft(dto);

      expect(responseRepo.save).not.toHaveBeenCalled();
      expect(questionResponseRepo.delete).toHaveBeenCalledWith({ evaluationResponseId: 'draft-1' });
      expect(result).toEqual({ responseId: 'draft-1' });
    });
  });
});

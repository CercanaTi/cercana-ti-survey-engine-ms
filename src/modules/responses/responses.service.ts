import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { LoggerService } from '../../common/services/logger.service';
import { EvaluationResponse } from './entities/evaluation-response.entity';
import { QuestionResponse } from './entities/question-response.entity';
import { EvaluationResponseStatus } from './enums/evaluation-response-status.enum';
import { ReceiveEvaluationDto } from './dto/receive-evaluation.dto';
import { SaveDraftDto } from './dto/save-draft.dto';
import { ResponseStatusDto } from './dto/response-status.dto';
import { QuestionAnswerDto } from './dto/question-answer.dto';
import { SCORING_QUEUE } from '../queue/queue.constants';
import { SCORING_JOB_NAME } from './constants/responses.constants';

interface ReceiveResult {
  responseId: string;
  status: 'queued';
}

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(EvaluationResponse)
    private readonly responseRepo: Repository<EvaluationResponse>,
    @InjectRepository(QuestionResponse)
    private readonly questionResponseRepo: Repository<QuestionResponse>,
    @InjectQueue(SCORING_QUEUE)
    private readonly scoringQueue: Queue,
    private readonly logger: LoggerService,
  ) {}

  async receive(dto: ReceiveEvaluationDto): Promise<ReceiveResult> {
    this.assertHasAnswers(dto.answers);

    const existing = await this.findProcessed(dto.evaluatedUserId, dto.attempt);
    if (existing) {
      return { responseId: existing.id, status: 'queued' };
    }

    const response = await this.createResponse(dto);
    await this.saveAnswers(response.id, dto.answers);
    await this.enqueueScoring(response.id);

    return { responseId: response.id, status: 'queued' };
  }

  async saveDraft(dto: SaveDraftDto): Promise<{ responseId: string }> {
    const draft = await this.upsertDraft(dto);
    await this.questionResponseRepo.delete({ evaluationResponseId: draft.id });
    await this.saveAnswers(draft.id, dto.answers);
    return { responseId: draft.id };
  }

  async getStatus(responseId: string): Promise<ResponseStatusDto> {
    const response = await this.responseRepo.findOne({ where: { id: responseId } });
    if (!response) {
      throw new BadRequestException('Evaluation response not found');
    }
    return { status: response.status };
  }

  private assertHasAnswers(answers: QuestionAnswerDto[]): void {
    if (!answers || answers.length === 0) {
      throw new BadRequestException('At least one answer is required');
    }
  }

  private async findProcessed(
    evaluatedUserId: string,
    attempt: number,
  ): Promise<EvaluationResponse | null> {
    return this.responseRepo.findOne({
      where: { evaluatedUserId, attempt, status: EvaluationResponseStatus.PROCESADA },
    });
  }

  private async createResponse(dto: ReceiveEvaluationDto): Promise<EvaluationResponse> {
    const response = this.responseRepo.create({
      evaluatedUserId: dto.evaluatedUserId,
      evaluatorUserId: dto.evaluatorUserId,
      evaluatedPersonId: dto.evaluatedPersonId,
      surveyId: dto.surveyId,
      surveyVersion: dto.surveyVersion,
      attempt: dto.attempt,
      status: EvaluationResponseStatus.RECIBIDA,
      submittedAt: new Date(dto.submittedAt),
      durationSeconds: dto.durationSeconds ?? null,
      ipAddress: dto.ipAddress ?? null,
      userAgent: dto.userAgent ?? null,
    });
    return this.responseRepo.save(response);
  }

  private async upsertDraft(dto: SaveDraftDto): Promise<EvaluationResponse> {
    const existing = await this.responseRepo.findOne({
      where: {
        evaluatedUserId: dto.evaluatedUserId,
        attempt: dto.attempt,
        status: EvaluationResponseStatus.BORRADOR,
      },
    });
    if (existing) {
      return existing;
    }

    const draft = this.responseRepo.create({
      evaluatedUserId: dto.evaluatedUserId,
      evaluatorUserId: dto.evaluatorUserId,
      evaluatedPersonId: dto.evaluatedPersonId,
      surveyId: dto.surveyId,
      surveyVersion: dto.surveyVersion,
      attempt: dto.attempt,
      status: EvaluationResponseStatus.BORRADOR,
    });
    return this.responseRepo.save(draft);
  }

  private async saveAnswers(
    evaluationResponseId: string,
    answers: QuestionAnswerDto[],
  ): Promise<void> {
    const records = answers.map((answer) =>
      this.questionResponseRepo.create({
        evaluationResponseId,
        questionId: answer.questionId,
        sectionId: answer.sectionId,
        questionType: answer.questionType,
        textValue: answer.textValue ?? null,
        numericValue: answer.numericValue ?? null,
        selectedOptionIds: answer.selectedOptionIds ?? null,
        fileUrl: answer.fileUrl ?? null,
        rubricScores: answer.rubricScores ?? null,
      }),
    );
    await this.questionResponseRepo.save(records);
  }

  private async enqueueScoring(responseId: string): Promise<void> {
    try {
      await this.scoringQueue.add(SCORING_JOB_NAME, { responseId });
    } catch (error) {
      this.logger.error(
        `Failed to enqueue scoring job for response ${responseId}`,
        error instanceof Error ? error.stack : undefined,
        ResponsesService.name,
      );
    }
  }
}

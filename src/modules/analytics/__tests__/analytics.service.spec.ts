import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from '../analytics.service';
import { AdminClientService } from '../../admin-client/admin-client.service';
import { NodeAnalyticsSummary } from '../entities/node-analytics-summary.entity';
import { TeacherProgressSummary } from '../entities/teacher-progress-summary.entity';
import { EvaluationResult } from '../../results/entities/evaluation-result.entity';
import { SectionResult } from '../../results/entities/section-result.entity';
import { EvaluationResultStatus } from '../../results/enums/evaluation-result-status.enum';

type MockRepo<T extends object> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockRepo = <T extends object>(): MockRepo<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

const buildResult = (overrides: Partial<EvaluationResult>): EvaluationResult =>
  ({
    id: 'result-1',
    evaluationResponseId: 'response-1',
    evaluatorUserId: 'evaluator-1',
    evaluatedPersonId: 'person-1',
    surveyId: 'survey-1',
    hierarchyNodeId: 'node-1',
    totalScore: 80,
    maxPossibleScore: 100,
    percentageScore: 80,
    isPassing: true,
    classificationLabel: 'Excelente',
    classificationColor: '#22c55e',
    status: EvaluationResultStatus.PUBLICADO,
    period: '2025',
    ...overrides,
  }) as EvaluationResult;

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let nodeSummaryRepo: MockRepo<NodeAnalyticsSummary>;
  let teacherProgressRepo: MockRepo<TeacherProgressSummary>;
  let resultRepo: MockRepo<EvaluationResult>;
  let sectionResultRepo: MockRepo<SectionResult>;
  let adminClient: {
    getHierarchyDescendants: jest.Mock;
    getHierarchyAncestors: jest.Mock;
    getHierarchyNodes: jest.Mock;
  };

  beforeEach(async () => {
    nodeSummaryRepo = mockRepo<NodeAnalyticsSummary>();
    teacherProgressRepo = mockRepo<TeacherProgressSummary>();
    resultRepo = mockRepo<EvaluationResult>();
    sectionResultRepo = mockRepo<SectionResult>();
    adminClient = {
      getHierarchyDescendants: jest.fn().mockResolvedValue([]),
      getHierarchyAncestors: jest.fn().mockResolvedValue([]),
      getHierarchyNodes: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(NodeAnalyticsSummary), useValue: nodeSummaryRepo },
        { provide: getRepositoryToken(TeacherProgressSummary), useValue: teacherProgressRepo },
        { provide: getRepositoryToken(EvaluationResult), useValue: resultRepo },
        { provide: getRepositoryToken(SectionResult), useValue: sectionResultRepo },
        { provide: AdminClientService, useValue: adminClient },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('updateNodeSummary()', () => {
    it('counts only PUBLICADO results as completed and computes the completion rate', async () => {
      const results = [
        buildResult({
          id: 'r1',
          status: EvaluationResultStatus.PUBLICADO,
          totalScore: 90,
          classificationLabel: 'Excelente',
        }),
        buildResult({
          id: 'r2',
          status: EvaluationResultStatus.PUBLICADO,
          totalScore: 70,
          classificationLabel: 'Regular',
        }),
        buildResult({
          id: 'r3',
          status: EvaluationResultStatus.PENDIENTE_REVISION,
          totalScore: 50,
          classificationLabel: null,
        }),
        buildResult({
          id: 'r4',
          status: EvaluationResultStatus.CALCULADO,
          totalScore: 60,
          classificationLabel: null,
        }),
      ];
      resultRepo.find!.mockResolvedValue(results);
      sectionResultRepo.find!.mockResolvedValue([]);
      nodeSummaryRepo.findOne!.mockResolvedValue(null);
      nodeSummaryRepo.create!.mockImplementation((data) => data);
      nodeSummaryRepo.save!.mockResolvedValue(undefined);

      await service.updateNodeSummary('survey-1', 'node-1', '2025');

      expect(nodeSummaryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          totalAssigned: 4,
          totalCompleted: 2,
          completionRate: 50,
          avgScore: 80,
        }),
      );
    });
  });

  describe('distributionJson', () => {
    it('counts each classification label among the completed results', async () => {
      const results = [
        buildResult({
          id: 'r1',
          status: EvaluationResultStatus.PUBLICADO,
          classificationLabel: 'Excelente',
        }),
        buildResult({
          id: 'r2',
          status: EvaluationResultStatus.PUBLICADO,
          classificationLabel: 'Excelente',
        }),
        buildResult({
          id: 'r3',
          status: EvaluationResultStatus.PUBLICADO,
          classificationLabel: 'Bueno',
        }),
        buildResult({
          id: 'r4',
          status: EvaluationResultStatus.PUBLICADO,
          classificationLabel: 'Regular',
        }),
        buildResult({
          id: 'r5',
          status: EvaluationResultStatus.PUBLICADO,
          classificationLabel: 'Deficiente',
        }),
      ];
      resultRepo.find!.mockResolvedValue(results);
      sectionResultRepo.find!.mockResolvedValue([]);
      nodeSummaryRepo.findOne!.mockResolvedValue(null);
      nodeSummaryRepo.create!.mockImplementation((data) => data);
      nodeSummaryRepo.save!.mockResolvedValue(undefined);

      await service.updateNodeSummary('survey-1', 'node-1', '2025');

      expect(nodeSummaryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          distributionJson: { excelente: 2, bueno: 1, regular: 1, deficiente: 1 },
        }),
      );
    });
  });

  describe('topStrengths', () => {
    it('returns the 3 sections with the highest average percentage', async () => {
      const results = [
        buildResult({ id: 'r1', status: EvaluationResultStatus.PUBLICADO }),
        buildResult({ id: 'r2', status: EvaluationResultStatus.PUBLICADO }),
      ];
      resultRepo.find!.mockResolvedValue(results);
      sectionResultRepo.find!.mockResolvedValue([
        {
          id: 'sr1',
          evaluationResultId: 'r1',
          sectionId: 'sec-a',
          sectionName: 'Planificación',
          score: 9,
          maxScore: 10,
          percentage: 90,
        },
        {
          id: 'sr2',
          evaluationResultId: 'r2',
          sectionId: 'sec-a',
          sectionName: 'Planificación',
          score: 10,
          maxScore: 10,
          percentage: 100,
        },
        {
          id: 'sr3',
          evaluationResultId: 'r1',
          sectionId: 'sec-b',
          sectionName: 'Ejecución',
          score: 6,
          maxScore: 10,
          percentage: 60,
        },
        {
          id: 'sr4',
          evaluationResultId: 'r2',
          sectionId: 'sec-b',
          sectionName: 'Ejecución',
          score: 7,
          maxScore: 10,
          percentage: 70,
        },
        {
          id: 'sr5',
          evaluationResultId: 'r1',
          sectionId: 'sec-c',
          sectionName: 'Reflexión',
          score: 8,
          maxScore: 10,
          percentage: 80,
        },
        {
          id: 'sr6',
          evaluationResultId: 'r2',
          sectionId: 'sec-c',
          sectionName: 'Reflexión',
          score: 8,
          maxScore: 10,
          percentage: 80,
        },
        {
          id: 'sr7',
          evaluationResultId: 'r1',
          sectionId: 'sec-d',
          sectionName: 'Innovación',
          score: 4,
          maxScore: 10,
          percentage: 40,
        },
        {
          id: 'sr8',
          evaluationResultId: 'r2',
          sectionId: 'sec-d',
          sectionName: 'Innovación',
          score: 5,
          maxScore: 10,
          percentage: 50,
        },
      ]);
      nodeSummaryRepo.findOne!.mockResolvedValue(null);
      nodeSummaryRepo.create!.mockImplementation((data) => data);
      nodeSummaryRepo.save!.mockResolvedValue(undefined);

      await service.updateNodeSummary('survey-1', 'node-1', '2025');

      const savedSummary = nodeSummaryRepo.save!.mock.calls[0][0];
      expect(savedSummary.topStrengths).toHaveLength(3);
      expect(
        savedSummary.topStrengths.map((entry: { sectionName: string }) => entry.sectionName),
      ).toEqual(['Planificación', 'Reflexión', 'Ejecución']);
    });
  });

  describe('updateTeacherProgress()', () => {
    it('calculates the percentile as the share of peer scores below the given score', async () => {
      const result = buildResult({ id: 'result-1', evaluatedPersonId: 'person-1', totalScore: 80 });
      sectionResultRepo.find!.mockResolvedValue([
        {
          id: 'sr1',
          evaluationResultId: 'result-1',
          sectionId: 'sec-a',
          sectionName: 'Planificación',
          score: 8,
          maxScore: 10,
          percentage: 80,
        },
      ]);
      resultRepo.find!.mockResolvedValue([
        { totalScore: 60 },
        { totalScore: 70 },
        { totalScore: 75 },
        { totalScore: 90 },
      ]);
      teacherProgressRepo.findOne!.mockResolvedValue(null);
      teacherProgressRepo.create!.mockImplementation((data) => data);
      teacherProgressRepo.save!.mockResolvedValue(undefined);

      await service.updateTeacherProgress('person-1', 'survey-1', '2025', result);

      // 3 of 4 peer scores (60, 70, 75) are below 80 -> 75th percentile
      expect(teacherProgressRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          percentile: 75,
          score: 80,
          sectionScores: { 'sec-a': 8 },
        }),
      );
    });
  });
});

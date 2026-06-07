import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { LoggerService } from '../../common/services/logger.service';
import { AdminClientService } from '../admin-client/admin-client.service';
import { SurveyStructure } from '../admin-client/interfaces';
import { EvaluationResponse } from '../responses/entities/evaluation-response.entity';
import { QuestionResponse } from '../responses/entities/question-response.entity';
import { EvaluationResponseStatus } from '../responses/enums/evaluation-response-status.enum';
import { SCORING_JOB_NAME } from '../responses/constants/responses.constants';
import { EvaluationResult } from '../results/entities/evaluation-result.entity';
import { SectionResult } from '../results/entities/section-result.entity';
import { ManualReviewTask } from '../results/entities/manual-review-task.entity';
import { EvaluationResultStatus } from '../results/enums/evaluation-result-status.enum';
import { ManualReviewStatus } from '../results/enums/manual-review-status.enum';
import { SCORING_QUEUE, ANALYTICS_QUEUE, NOTIFICATIONS_QUEUE } from '../queue/queue.constants';
import { ScoringService } from './scoring.service';
import { ManualReviewCandidate, ScoringResult } from './interfaces';
import { ANALYTICS_JOB_NAME, NOTIFICATIONS_JOB_NAME } from './constants/scoring.constants';

interface ScoringJobData {
  responseId: string;
}

@Processor(SCORING_QUEUE)
export class ScoringProcessor extends WorkerHost {
  constructor(
    @InjectRepository(EvaluationResponse)
    private readonly responseRepo: Repository<EvaluationResponse>,
    @InjectRepository(QuestionResponse)
    private readonly questionResponseRepo: Repository<QuestionResponse>,
    @InjectRepository(EvaluationResult)
    private readonly resultRepo: Repository<EvaluationResult>,
    @InjectRepository(SectionResult)
    private readonly sectionResultRepo: Repository<SectionResult>,
    @InjectRepository(ManualReviewTask)
    private readonly manualReviewTaskRepo: Repository<ManualReviewTask>,
    @InjectQueue(ANALYTICS_QUEUE)
    private readonly analyticsQueue: Queue,
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly notificationsQueue: Queue,
    private readonly adminClient: AdminClientService,
    private readonly scoringService: ScoringService,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async process(job: Job<ScoringJobData>): Promise<void> {
    if (job.name !== SCORING_JOB_NAME) {
      return;
    }

    const response = await this.loadResponse(job.data.responseId);

    try {
      await this.setResponseStatus(response, EvaluationResponseStatus.PROCESANDO);

      const survey = await this.adminClient.getSurveyStructure(response.surveyId);
      const questionResponses = await this.questionResponseRepo.find({
        where: { evaluationResponseId: response.id },
      });

      const scoring = this.scoringService.calculateScore(questionResponses, survey);
      const result = await this.persistResult(response, survey, scoring);
      await this.persistSectionResults(result, scoring);
      const reviewTasks = await this.persistManualReviewTasks(
        result,
        scoring.manualReviewCandidates,
      );
      await this.finalizeResult(result, reviewTasks.length > 0);

      await this.setResponseStatus(response, EvaluationResponseStatus.PROCESADA);

      await this.enqueueAnalyticsUpdate(result);
      await this.enqueueNotification(result);
    } catch (error) {
      await this.markError(response, error);
      throw error;
    }
  }

  private async loadResponse(responseId: string): Promise<EvaluationResponse> {
    const response = await this.responseRepo.findOne({ where: { id: responseId } });
    if (!response) {
      throw new Error(`EvaluationResponse ${responseId} not found`);
    }
    return response;
  }

  private async setResponseStatus(
    response: EvaluationResponse,
    status: EvaluationResponseStatus,
  ): Promise<void> {
    response.status = status;
    await this.responseRepo.save(response);
  }

  private async persistResult(
    response: EvaluationResponse,
    survey: SurveyStructure,
    scoring: ScoringResult,
  ): Promise<EvaluationResult> {
    const hierarchyNodeId = survey.evaluatedPersonNodes?.[response.evaluatedPersonId];
    if (!hierarchyNodeId) {
      throw new Error(
        `Unable to resolve hierarchy node for evaluated person ${response.evaluatedPersonId}`,
      );
    }

    const result = this.resultRepo.create({
      evaluationResponseId: response.id,
      evaluatorUserId: response.evaluatorUserId,
      evaluatedPersonId: response.evaluatedPersonId,
      surveyId: response.surveyId,
      hierarchyNodeId,
      totalScore: scoring.totalScore,
      maxPossibleScore: scoring.maxPossibleScore,
      percentageScore: scoring.percentageScore,
      isPassing: scoring.isPassing,
      classificationLabel: scoring.classificationLabel,
      classificationColor: scoring.classificationColor,
      status: EvaluationResultStatus.CALCULADO,
      calculatedAt: new Date(),
      period: survey.period,
    });
    return this.resultRepo.save(result);
  }

  private async persistSectionResults(
    result: EvaluationResult,
    scoring: ScoringResult,
  ): Promise<void> {
    const records = scoring.sectionResults.map((section) =>
      this.sectionResultRepo.create({
        evaluationResultId: result.id,
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        score: section.score,
        maxScore: section.maxScore,
        percentage: section.percentage,
      }),
    );
    await this.sectionResultRepo.save(records);
  }

  private async persistManualReviewTasks(
    result: EvaluationResult,
    candidates: ManualReviewCandidate[],
  ): Promise<ManualReviewTask[]> {
    if (candidates.length === 0) {
      return [];
    }
    const records = candidates.map((candidate) =>
      this.manualReviewTaskRepo.create({
        evaluationResultId: result.id,
        questionId: candidate.questionId,
        questionText: candidate.questionText,
        responseValue: candidate.responseValue,
        status: ManualReviewStatus.PENDIENTE,
      }),
    );
    return this.manualReviewTaskRepo.save(records);
  }

  private async finalizeResult(result: EvaluationResult, hasManualReview: boolean): Promise<void> {
    if (hasManualReview) {
      result.status = EvaluationResultStatus.PENDIENTE_REVISION;
    } else {
      result.status = EvaluationResultStatus.PUBLICADO;
      result.publishedAt = new Date();
    }
    await this.resultRepo.save(result);
  }

  private async markError(response: EvaluationResponse, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(
      `Scoring failed for response ${response.id}: ${message}`,
      error instanceof Error ? error.stack : undefined,
      ScoringProcessor.name,
    );
    response.status = EvaluationResponseStatus.ERROR;
    response.errorMessage = message;
    await this.responseRepo.save(response);
  }

  private async enqueueAnalyticsUpdate(result: EvaluationResult): Promise<void> {
    await this.analyticsQueue.add(ANALYTICS_JOB_NAME, {
      surveyId: result.surveyId,
      hierarchyNodeId: result.hierarchyNodeId,
      period: result.period,
    });
  }

  private async enqueueNotification(result: EvaluationResult): Promise<void> {
    await this.notificationsQueue.add(NOTIFICATIONS_JOB_NAME, {
      evaluatedPersonId: result.evaluatedPersonId,
      surveyId: result.surveyId,
      resultId: result.id,
    });
  }
}

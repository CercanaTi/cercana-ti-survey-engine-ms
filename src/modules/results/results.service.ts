import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NodeAnalyticsSummary } from '../analytics/entities/node-analytics-summary.entity';
import { TeacherProgressSummary } from '../analytics/entities/teacher-progress-summary.entity';
import { NationalOverviewDto } from '../analytics/dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { EvaluationResult } from './entities/evaluation-result.entity';
import { SectionResult } from './entities/section-result.entity';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(EvaluationResult)
    private readonly resultRepo: Repository<EvaluationResult>,
    @InjectRepository(SectionResult)
    private readonly sectionResultRepo: Repository<SectionResult>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getResult(
    evaluationResultId: string,
  ): Promise<EvaluationResult & { sections: SectionResult[] }> {
    const result = await this.resultRepo.findOne({ where: { id: evaluationResultId } });
    if (!result) {
      throw new NotFoundException(`EvaluationResult ${evaluationResultId} not found`);
    }
    const sections = await this.sectionResultRepo.find({
      where: { evaluationResultId: result.id },
    });
    return { ...result, sections };
  }

  async getResultsForCampaign(
    campaignId: string,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<EvaluationResult[]> {
    return this.resultRepo.find({
      where: { surveyId: campaignId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async getResultsForPerson(
    evaluatedPersonId: string,
    surveyId?: string,
    period?: string,
  ): Promise<EvaluationResult[]> {
    return this.resultRepo.find({
      where: {
        evaluatedPersonId,
        ...(surveyId ? { surveyId } : {}),
        ...(period ? { period } : {}),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getResultsForNode(
    hierarchyNodeId: string,
    surveyId: string,
    period: string,
  ): Promise<EvaluationResult[]> {
    return this.resultRepo.find({
      where: { hierarchyNodeId, surveyId, period },
      order: { createdAt: 'DESC' },
    });
  }

  async getNodeAnalytics(
    nodeId: string,
    surveyId: string,
    period: string,
  ): Promise<NodeAnalyticsSummary> {
    return this.analyticsService.getNodeAnalytics(nodeId, surveyId, period);
  }

  async getTeacherProgress(
    userId: string,
    surveyId: string,
    period: string,
  ): Promise<TeacherProgressSummary> {
    return this.analyticsService.getTeacherProgress(userId, surveyId, period);
  }

  async getNationalOverview(surveyId: string, period: string): Promise<NationalOverviewDto> {
    return this.analyticsService.getNationalOverview(surveyId, period);
  }
}

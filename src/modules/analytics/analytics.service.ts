import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdminClientService } from '../admin-client/admin-client.service';
import { EvaluationResult } from '../results/entities/evaluation-result.entity';
import { SectionResult } from '../results/entities/section-result.entity';
import { EvaluationResultStatus } from '../results/enums/evaluation-result-status.enum';
import {
  NodeAnalyticsSummary,
  ScoreDistribution,
  SectionScoreSummary,
} from './entities/node-analytics-summary.entity';
import { TeacherProgressSummary } from './entities/teacher-progress-summary.entity';
import { NationalOverviewDto } from './dto';
import { DISTRIBUTION_KEYS, HIERARCHY_NODE_TYPES } from './constants/analytics.constants';

const TOP_SECTIONS_COUNT = 3;

interface NodeSummaryComputation {
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
  avgScore: number | null;
  distributionJson: ScoreDistribution;
  topStrengths: SectionScoreSummary[];
  topWeaknesses: SectionScoreSummary[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(NodeAnalyticsSummary)
    private readonly nodeSummaryRepo: Repository<NodeAnalyticsSummary>,
    @InjectRepository(TeacherProgressSummary)
    private readonly teacherProgressRepo: Repository<TeacherProgressSummary>,
    @InjectRepository(EvaluationResult)
    private readonly resultRepo: Repository<EvaluationResult>,
    @InjectRepository(SectionResult)
    private readonly sectionResultRepo: Repository<SectionResult>,
    private readonly adminClient: AdminClientService,
  ) {}

  async updateNodeSummary(surveyId: string, nodeId: string, period: string): Promise<void> {
    const descendantIds = await this.adminClient.getHierarchyDescendants(nodeId);
    const scopedNodeIds = [nodeId, ...descendantIds];

    const results = await this.resultRepo.find({
      where: { surveyId, period, hierarchyNodeId: In(scopedNodeIds) },
    });

    const computation = await this.computeNodeSummary(results);
    await this.upsertNodeSummary(nodeId, surveyId, period, computation);
  }

  /**
   * The analytics job payload only carries the affected hierarchy node, not the
   * evaluated person — refresh the teacher progress summary for everyone whose
   * result is scoped to exactly this node.
   */
  async refreshTeacherProgressForNode(
    surveyId: string,
    nodeId: string,
    period: string,
  ): Promise<void> {
    const results = await this.resultRepo.find({
      where: {
        surveyId,
        period,
        hierarchyNodeId: nodeId,
        status: EvaluationResultStatus.PUBLICADO,
      },
    });
    for (const result of results) {
      await this.updateTeacherProgress(result.evaluatedPersonId, surveyId, period, result);
    }
  }

  async getNodeAnalytics(
    nodeId: string,
    surveyId: string,
    period: string,
  ): Promise<NodeAnalyticsSummary> {
    const summary = await this.nodeSummaryRepo.findOne({
      where: { hierarchyNodeId: nodeId, surveyId, period },
    });
    if (!summary) {
      throw new NotFoundException('Analytics summary not found for this node');
    }
    return summary;
  }

  async getTeacherProgress(
    userId: string,
    surveyId: string,
    period: string,
  ): Promise<TeacherProgressSummary> {
    const summary = await this.teacherProgressRepo.findOne({ where: { userId, surveyId, period } });
    if (!summary) {
      throw new NotFoundException('Teacher progress summary not found');
    }
    return summary;
  }

  async updateTeacherProgress(
    userId: string,
    surveyId: string,
    period: string,
    result: EvaluationResult,
  ): Promise<void> {
    const sectionResults = await this.sectionResultRepo.find({
      where: { evaluationResultId: result.id },
    });
    const sectionScores: Record<string, number> = {};
    for (const sectionResult of sectionResults) {
      sectionScores[sectionResult.sectionId] = Number(sectionResult.score);
    }

    const percentile = await this.calculatePercentile(surveyId, period, Number(result.totalScore));

    let summary = await this.teacherProgressRepo.findOne({ where: { userId, surveyId, period } });
    if (!summary) {
      summary = this.teacherProgressRepo.create({ userId, surveyId, period });
    }
    summary.score = result.totalScore;
    summary.percentile = percentile;
    summary.sectionScores = sectionScores;
    await this.teacherProgressRepo.save(summary);
  }

  async getNationalOverview(surveyId: string, period: string): Promise<NationalOverviewDto> {
    const summaries = await this.nodeSummaryRepo.find({ where: { surveyId, period } });
    if (summaries.length === 0) {
      return this.emptyNationalOverview();
    }

    const nodeInfos = await this.adminClient.getHierarchyNodes(
      summaries.map((summary) => summary.hierarchyNodeId),
    );
    const infoByNodeId = new Map(nodeInfos.map((info) => [info.id, info]));

    const ministerioSummary = summaries.find(
      (summary) =>
        infoByNodeId.get(summary.hierarchyNodeId)?.type === HIERARCHY_NODE_TYPES.MINISTERIO,
    );
    const regionalSummaries = summaries.filter(
      (summary) =>
        infoByNodeId.get(summary.hierarchyNodeId)?.type === HIERARCHY_NODE_TYPES.REGIONAL,
    );

    return {
      totalTeachers: ministerioSummary?.totalAssigned ?? 0,
      totalCompleted: ministerioSummary?.totalCompleted ?? 0,
      nationalAvgScore:
        ministerioSummary?.avgScore != null ? Number(ministerioSummary.avgScore) : 0,
      completionRate: ministerioSummary ? Number(ministerioSummary.completionRate) : 0,
      byRegional: regionalSummaries.map((summary) => ({
        nodeId: summary.hierarchyNodeId,
        name: infoByNodeId.get(summary.hierarchyNodeId)?.name ?? summary.hierarchyNodeId,
        avgScore: summary.avgScore != null ? Number(summary.avgScore) : 0,
        completionRate: Number(summary.completionRate),
      })),
      distributionNational: ministerioSummary?.distributionJson
        ? { ...ministerioSummary.distributionJson }
        : {},
    };
  }

  private async computeNodeSummary(results: EvaluationResult[]): Promise<NodeSummaryComputation> {
    const completed = results.filter(
      (result) => result.status === EvaluationResultStatus.PUBLICADO,
    );
    const totalAssigned = results.length;
    const totalCompleted = completed.length;
    const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;
    const avgScore =
      completed.length > 0
        ? this.average(completed.map((result) => Number(result.totalScore)))
        : null;
    const distributionJson = this.buildDistribution(completed);
    const { topStrengths, topWeaknesses } = await this.computeSectionRankings(
      completed.map((result) => result.id),
    );

    return {
      totalAssigned,
      totalCompleted,
      completionRate,
      avgScore,
      distributionJson,
      topStrengths,
      topWeaknesses,
    };
  }

  private buildDistribution(results: EvaluationResult[]): ScoreDistribution {
    const distribution: ScoreDistribution = { excelente: 0, bueno: 0, regular: 0, deficiente: 0 };
    for (const result of results) {
      const key = result.classificationLabel?.trim().toLowerCase();
      if (key && (DISTRIBUTION_KEYS as readonly string[]).includes(key)) {
        distribution[key as keyof ScoreDistribution] += 1;
      }
    }
    return distribution;
  }

  private async computeSectionRankings(
    resultIds: string[],
  ): Promise<{ topStrengths: SectionScoreSummary[]; topWeaknesses: SectionScoreSummary[] }> {
    if (resultIds.length === 0) {
      return { topStrengths: [], topWeaknesses: [] };
    }

    const sectionResults = await this.sectionResultRepo.find({
      where: { evaluationResultId: In(resultIds) },
    });
    const percentagesBySection = new Map<string, number[]>();
    for (const sectionResult of sectionResults) {
      const list = percentagesBySection.get(sectionResult.sectionName) ?? [];
      list.push(Number(sectionResult.percentage));
      percentagesBySection.set(sectionResult.sectionName, list);
    }

    const summaries: SectionScoreSummary[] = Array.from(percentagesBySection.entries()).map(
      ([sectionName, percentages]) => ({ sectionName, avgScore: this.average(percentages) }),
    );

    const sortedDescending = [...summaries].sort((a, b) => b.avgScore - a.avgScore);
    const sortedAscending = [...summaries].sort((a, b) => a.avgScore - b.avgScore);

    return {
      topStrengths: sortedDescending.slice(0, TOP_SECTIONS_COUNT),
      topWeaknesses: sortedAscending.slice(0, TOP_SECTIONS_COUNT),
    };
  }

  private async upsertNodeSummary(
    nodeId: string,
    surveyId: string,
    period: string,
    computation: NodeSummaryComputation,
  ): Promise<void> {
    let summary = await this.nodeSummaryRepo.findOne({
      where: { hierarchyNodeId: nodeId, surveyId, period },
    });
    if (!summary) {
      summary = this.nodeSummaryRepo.create({ hierarchyNodeId: nodeId, surveyId, period });
    }
    summary.totalAssigned = computation.totalAssigned;
    summary.totalCompleted = computation.totalCompleted;
    summary.completionRate = computation.completionRate;
    summary.avgScore = computation.avgScore;
    summary.distributionJson = computation.distributionJson;
    summary.topStrengths = computation.topStrengths;
    summary.topWeaknesses = computation.topWeaknesses;
    summary.calculatedAt = new Date();
    await this.nodeSummaryRepo.save(summary);
  }

  private async calculatePercentile(
    surveyId: string,
    period: string,
    score: number,
  ): Promise<number> {
    const peers = await this.resultRepo.find({
      where: { surveyId, period, status: EvaluationResultStatus.PUBLICADO },
      select: ['totalScore'],
    });
    if (peers.length === 0) {
      return 0;
    }
    const below = peers.filter((peer) => Number(peer.totalScore) < score).length;
    return (below / peers.length) * 100;
  }

  private average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private emptyNationalOverview(): NationalOverviewDto {
    return {
      totalTeachers: 0,
      totalCompleted: 0,
      nationalAvgScore: 0,
      completionRate: 0,
      byRegional: [],
      distributionNational: {},
    };
  }
}

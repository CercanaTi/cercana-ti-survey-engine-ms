import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LoggerService } from '../../common/services/logger.service';
import { AdminClientService } from '../admin-client/admin-client.service';
import { ANALYTICS_QUEUE } from '../queue/queue.constants';
import { ANALYTICS_JOB_NAME } from '../scoring/constants/scoring.constants';
import { AnalyticsService } from './analytics.service';

interface AnalyticsJobData {
  surveyId: string;
  hierarchyNodeId: string;
  period: string;
}

@Processor(ANALYTICS_QUEUE)
export class AnalyticsProcessor extends WorkerHost {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly adminClient: AdminClientService,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async process(job: Job<AnalyticsJobData>): Promise<void> {
    if (job.name !== ANALYTICS_JOB_NAME) {
      return;
    }

    const { surveyId, hierarchyNodeId, period } = job.data;

    await this.analyticsService.updateNodeSummary(surveyId, hierarchyNodeId, period);
    await this.analyticsService.refreshTeacherProgressForNode(surveyId, hierarchyNodeId, period);

    const ancestorIds = await this.adminClient.getHierarchyAncestors(hierarchyNodeId);
    for (const ancestorId of ancestorIds) {
      await this.analyticsService.updateNodeSummary(surveyId, ancestorId, period);
    }

    this.logger.log(
      `Analytics updated for node ${hierarchyNodeId} and ${ancestorIds.length} ancestors`,
      AnalyticsProcessor.name,
    );
  }
}

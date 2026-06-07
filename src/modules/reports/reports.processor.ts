import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { LoggerService } from '../../common/services/logger.service';
import { AdminClientService } from '../admin-client/admin-client.service';
import { REPORTS_QUEUE } from '../queue/queue.constants';
import { ReportRequest } from './entities/report-request.entity';
import { ReportRequestStatus } from './enums/report-request-status.enum';
import { CLEANUP_JOB_NAME, REPORT_TYPES, REPORTS_JOB_NAME } from './constants/reports.constants';
import { ReportsService } from './reports.service';

interface ReportJobData {
  requestId: string;
}

interface GeneratedFile {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

@Processor(REPORTS_QUEUE)
export class ReportsProcessor extends WorkerHost {
  constructor(
    @InjectRepository(ReportRequest)
    private readonly reportRequestRepo: Repository<ReportRequest>,
    private readonly reportsService: ReportsService,
    private readonly adminClient: AdminClientService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  async process(job: Job<ReportJobData>): Promise<void> {
    switch (job.name) {
      case REPORTS_JOB_NAME:
        return this.handleGenerate(job);
      case CLEANUP_JOB_NAME:
        return this.reportsService.cleanupExpiredReports();
      default:
        return undefined;
    }
  }

  private async handleGenerate(job: Job<ReportJobData>): Promise<void> {
    const request = await this.reportRequestRepo.findOne({ where: { id: job.data.requestId } });
    if (!request) {
      throw new Error(`ReportRequest ${job.data.requestId} not found`);
    }

    try {
      request.status = ReportRequestStatus.GENERATING;
      await this.reportRequestRepo.save(request);

      const file = await this.generateFile(request);
      const { path, size } = await this.reportsService.uploadReportFile(
        request.id,
        file.filename,
        file.buffer,
        file.contentType,
      );

      const expirationHours = this.configService.get<number>('app.reportExpirationHours') ?? 24;
      request.status = ReportRequestStatus.READY;
      request.fileUrl = path;
      request.fileSize = size;
      request.expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
      request.completedAt = new Date();
      await this.reportRequestRepo.save(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Report generation failed for request ${request.id}: ${message}`,
        error instanceof Error ? error.stack : undefined,
        ReportsProcessor.name,
      );
      request.status = ReportRequestStatus.FAILED;
      request.errorMessage = message;
      await this.reportRequestRepo.save(request);
      throw error;
    }
  }

  private async generateFile(request: ReportRequest): Promise<GeneratedFile> {
    const params = request.parameters as Record<string, string>;

    switch (request.reportType) {
      case REPORT_TYPES.INDIVIDUAL_RESULT: {
        const requestedByName = await this.resolveRequesterName(request.requestedBy);
        const buffer = await this.reportsService.generateIndividualPdf(
          params.evaluationResultId,
          requestedByName,
        );
        return { buffer, filename: 'resultado-individual.pdf', contentType: 'application/pdf' };
      }
      case REPORT_TYPES.CENTER_CONSOLIDADO: {
        const buffer = await this.reportsService.generateCenterExcel(
          params.centerId,
          params.surveyId,
          params.period,
        );
        return {
          buffer,
          filename: 'consolidado-centro.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
      }
      default:
        throw new Error(`Report type "${request.reportType}" is not yet supported`);
    }
  }

  private async resolveRequesterName(requestedBy: string): Promise<string | undefined> {
    const [profile] = await this.adminClient.getPersonProfiles([requestedBy]);
    return profile?.fullName;
  }
}

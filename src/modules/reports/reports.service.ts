import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { LessThan, Repository } from 'typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as ExcelJS from 'exceljs';
// `pdfmake` only exposes its API via `export =`, so the import-equals form is the only
// TypeScript-correct way to bring in its default export and the bundled vfs fonts.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PdfPrinter = require('pdfmake');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import vfsFonts = require('pdfmake/build/vfs_fonts');
import { LoggerService } from '../../common/services/logger.service';
import { AdminClientService } from '../admin-client/admin-client.service';
import { EvaluationResult } from '../results/entities/evaluation-result.entity';
import { SectionResult } from '../results/entities/section-result.entity';
import { PersonProfile } from '../admin-client/interfaces';
import { NodeAnalyticsSummary } from '../analytics/entities/node-analytics-summary.entity';
import { REPORTS_QUEUE } from '../queue/queue.constants';
import { ReportRequest } from './entities/report-request.entity';
import { ReportRequestStatus } from './enums/report-request-status.enum';
import { CLASSIFICATION_FILL_COLORS, REPORTS_JOB_NAME } from './constants/reports.constants';

/**
 * `@types/pdfmake` only exposes the `PdfPrinter` class (via `export =`), not its
 * supporting interfaces — derive the shapes we need straight from the class signature.
 */
type TFontDictionary = ConstructorParameters<typeof PdfPrinter>[0];
type TDocumentDefinitions = Parameters<InstanceType<typeof PdfPrinter>['createPdfKitDocument']>[0];
type Content = TDocumentDefinitions['content'];
/** A `columns` array entry — same as `Content` but additionally accepts a `width`. */
type Column = Content & { width?: number | string };

const SIGNED_URL_TTL_SECONDS = 60 * 60;

const decodeFont = (filename: string): Buffer => Buffer.from(vfsFonts[filename], 'base64');

const ROBOTO_FONTS: TFontDictionary = {
  Roboto: {
    normal: decodeFont('Roboto-Regular.ttf'),
    bold: decodeFont('Roboto-Medium.ttf'),
    italics: decodeFont('Roboto-Italic.ttf'),
    bolditalics: decodeFont('Roboto-MediumItalic.ttf'),
  },
};

const DEFAULT_CLASSIFICATION_COLOR = '#64748b';

interface UploadResult {
  path: string;
  size: number;
}

@Injectable()
export class ReportsService {
  private readonly supabase: SupabaseClient;
  private readonly printer: PdfPrinter;

  constructor(
    @InjectRepository(ReportRequest)
    private readonly reportRequestRepo: Repository<ReportRequest>,
    @InjectRepository(EvaluationResult)
    private readonly resultRepo: Repository<EvaluationResult>,
    @InjectRepository(SectionResult)
    private readonly sectionResultRepo: Repository<SectionResult>,
    @InjectRepository(NodeAnalyticsSummary)
    private readonly nodeSummaryRepo: Repository<NodeAnalyticsSummary>,
    @InjectQueue(REPORTS_QUEUE)
    private readonly reportsQueue: Queue,
    private readonly adminClient: AdminClientService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('app.supabaseUrl') ?? '',
      this.configService.get<string>('app.supabaseServiceRoleKey') ?? '',
    );
    this.printer = new PdfPrinter(ROBOTO_FONTS);
  }

  async requestReport(
    requestedBy: string,
    reportType: string,
    parameters: Record<string, unknown>,
  ): Promise<ReportRequest> {
    const request = this.reportRequestRepo.create({
      requestedBy,
      reportType,
      parameters,
      status: ReportRequestStatus.PENDING,
    });
    const saved = await this.reportRequestRepo.save(request);
    await this.reportsQueue.add(REPORTS_JOB_NAME, { requestId: saved.id });
    return saved;
  }

  async generateIndividualPdf(resultId: string, requestedByName?: string): Promise<Buffer> {
    const result = await this.resultRepo.findOne({ where: { id: resultId } });
    if (!result) {
      throw new NotFoundException(`EvaluationResult ${resultId} not found`);
    }

    const sections = await this.sectionResultRepo.find({
      where: { evaluationResultId: result.id },
    });
    const [survey, [person], [center]] = await Promise.all([
      this.adminClient.getSurveyStructure(result.surveyId),
      this.adminClient.getPersonProfiles([result.evaluatedPersonId]),
      this.adminClient.getHierarchyNodes([result.hierarchyNodeId]),
    ]);

    const docDefinition = this.buildIndividualPdfDefinition({
      result,
      sections,
      surveyName: survey.name,
      personName: person?.fullName ?? result.evaluatedPersonId,
      personCedula: person?.cedula ?? '—',
      centerName: center?.name ?? result.hierarchyNodeId,
      requestedByName,
    });

    const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
    return this.collectPdfBuffer(pdfDoc);
  }

  async generateCenterExcel(centerId: string, surveyId: string, period: string): Promise<Buffer> {
    const [summary, [center], results] = await Promise.all([
      this.nodeSummaryRepo.findOne({ where: { hierarchyNodeId: centerId, surveyId, period } }),
      this.adminClient.getHierarchyNodes([centerId]),
      this.resultRepo.find({ where: { hierarchyNodeId: centerId, surveyId, period } }),
    ]);

    const profiles = await this.adminClient.getPersonProfiles(
      results.map((result) => result.evaluatedPersonId),
    );
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

    const workbook = new ExcelJS.Workbook();
    this.buildSummarySheet(workbook, center?.name ?? centerId, summary);
    this.buildTeacherListSheet(workbook, results, profileById);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async getStatus(requestId: string, userId: string): Promise<ReportRequest> {
    const request = await this.reportRequestRepo.findOne({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`ReportRequest ${requestId} not found`);
    }
    if (request.requestedBy !== userId) {
      throw new ForbiddenException('You are not allowed to access this report request');
    }
    return request;
  }

  async getDownloadUrl(
    requestId: string,
    userId: string,
  ): Promise<{ url: string; expiresAt: Date }> {
    const request = await this.getStatus(requestId, userId);

    if (request.status !== ReportRequestStatus.READY || !request.fileUrl) {
      throw new BadRequestException('Report is not ready for download');
    }
    if (request.expiresAt && request.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Report has expired');
    }

    const bucket = this.configService.get<string>('app.storageBucketReports') ?? '';
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(request.fileUrl, SIGNED_URL_TTL_SECONDS);
    if (error || !data) {
      this.logger.error(
        `Failed to sign download URL for report ${requestId}: ${error?.message}`,
        undefined,
        ReportsService.name,
      );
      throw new BadRequestException('Unable to generate download URL');
    }

    return { url: data.signedUrl, expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000) };
  }

  async cleanupExpiredReports(): Promise<void> {
    const expired = await this.reportRequestRepo.find({
      where: { status: ReportRequestStatus.READY, expiresAt: LessThan(new Date()) },
    });
    if (expired.length === 0) {
      return;
    }

    const bucket = this.configService.get<string>('app.storageBucketReports') ?? '';
    for (const request of expired) {
      if (request.fileUrl) {
        const { error } = await this.supabase.storage.from(bucket).remove([request.fileUrl]);
        if (error) {
          this.logger.error(
            `Failed to remove expired report file ${request.fileUrl}: ${error.message}`,
            undefined,
            ReportsService.name,
          );
        }
      }
      request.status = ReportRequestStatus.EXPIRED;
      await this.reportRequestRepo.save(request);
    }
  }

  async uploadReportFile(
    requestId: string,
    filename: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<UploadResult> {
    const bucket = this.configService.get<string>('app.storageBucketReports') ?? '';
    const path = `reports/${requestId}/${filename}`;
    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType, upsert: true });
    if (error) {
      throw new Error(`Failed to upload report file: ${error.message}`);
    }
    return { path, size: buffer.length };
  }

  private async collectPdfBuffer(pdfDoc: PDFKit.PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  private buildIndividualPdfDefinition(input: {
    result: EvaluationResult;
    sections: SectionResult[];
    surveyName: string;
    personName: string;
    personCedula: string;
    centerName: string;
    requestedByName?: string;
  }): TDocumentDefinitions {
    const { result, sections, surveyName, personName, personCedula, centerName, requestedByName } =
      input;
    const classificationColor = result.classificationColor ?? DEFAULT_CLASSIFICATION_COLOR;
    const generatedAt = new Date();

    const content: Content[] = [
      { text: 'SED-RD — Sistema de Evaluación Docente', style: 'logo' },
      { text: 'Resultado individual de evaluación', style: 'title' },
      {
        columns: [
          [
            { text: personName, style: 'subject' },
            { text: `Cédula: ${personCedula}`, style: 'meta' },
            { text: `Centro: ${centerName}`, style: 'meta' },
            { text: `Encuesta: ${surveyName}`, style: 'meta' },
            { text: `Período: ${result.period}`, style: 'meta' },
            { text: `Fecha: ${generatedAt.toLocaleDateString('es-DO')}`, style: 'meta' },
          ],
          this.buildScoreCircle(Number(result.percentageScore), classificationColor),
        ],
      },
      {
        text: result.classificationLabel ?? 'Sin clasificación',
        style: 'classificationLabel',
        color: classificationColor,
        margin: [0, 8, 0, 16],
      },
      { text: 'Desglose por sección', style: 'sectionHeader' },
      ...this.buildSectionBars(sections),
      {
        text: 'Este documento contiene información confidencial de evaluación docente y su distribución está restringida al personal autorizado.',
        style: 'confidentiality',
        margin: [0, 24, 0, 0],
      },
      {
        text: `Generado el ${generatedAt.toLocaleString('es-DO')}`,
        style: 'meta',
      },
    ];

    if (requestedByName) {
      content.push({
        text: `Documento generado para: ${requestedByName}`,
        style: 'watermark',
      });
    }

    return {
      content,
      styles: {
        logo: { fontSize: 10, color: '#64748b', margin: [0, 0, 0, 8] },
        title: { fontSize: 18, bold: true, margin: [0, 0, 0, 16] },
        subject: { fontSize: 14, bold: true },
        meta: { fontSize: 10, color: '#475569', margin: [0, 2, 0, 0] },
        classificationLabel: { fontSize: 14, bold: true },
        sectionHeader: { fontSize: 13, bold: true, margin: [0, 8, 0, 8] },
        sectionName: { fontSize: 10, margin: [0, 0, 0, 2] },
        confidentiality: { fontSize: 8, italics: true, color: '#94a3b8' },
        watermark: { fontSize: 8, italics: true, color: '#cbd5e1', margin: [0, 4, 0, 0] },
      },
      defaultStyle: { font: 'Roboto' },
    };
  }

  private buildScoreCircle(percentageScore: number, color: string): Column {
    const radius = 45;
    return {
      width: 'auto',
      stack: [
        { canvas: [{ type: 'ellipse', x: radius, y: radius, r1: radius, r2: radius, color }] },
        {
          text: `${Math.round(percentageScore)}%`,
          fontSize: 18,
          bold: true,
          color: '#ffffff',
          alignment: 'center',
          relativePosition: { x: 0, y: -(radius + 10) },
        },
      ],
    };
  }

  private buildSectionBars(sections: SectionResult[]): Content[] {
    const maxBarWidth = 300;
    return sections.map((section) => {
      const ratio =
        Number(section.maxScore) > 0 ? Math.min(Number(section.percentage) / 100, 1) : 0;
      const barWidth = Math.max(maxBarWidth * ratio, 2);
      return {
        stack: [
          {
            text: `${section.sectionName} — ${Number(section.score)}/${Number(section.maxScore)} (${Number(section.percentage)}%)`,
            style: 'sectionName',
          },
          {
            canvas: [
              { type: 'rect', x: 0, y: 0, w: maxBarWidth, h: 8, color: '#e2e8f0' },
              { type: 'rect', x: 0, y: 0, w: barWidth, h: 8, color: '#3b82f6' },
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      } as Content;
    });
  }

  private buildSummarySheet(
    workbook: ExcelJS.Workbook,
    centerName: string,
    summary: NodeAnalyticsSummary | null,
  ): void {
    const sheet = workbook.addWorksheet('Resumen');
    sheet.columns = [
      { header: 'Indicador', key: 'indicator', width: 30 },
      { header: 'Valor', key: 'value', width: 20 },
    ];
    sheet.addRows([
      { indicator: 'Centro', value: centerName },
      { indicator: 'Total docentes evaluados', value: summary?.totalAssigned ?? 0 },
      { indicator: 'Evaluaciones completadas', value: summary?.totalCompleted ?? 0 },
      {
        indicator: 'Tasa de finalización (%)',
        value: summary ? Number(summary.completionRate) : 0,
      },
      {
        indicator: 'Puntuación promedio',
        value: summary?.avgScore != null ? Number(summary.avgScore) : '—',
      },
      { indicator: 'Excelente', value: summary?.distributionJson?.excelente ?? 0 },
      { indicator: 'Bueno', value: summary?.distributionJson?.bueno ?? 0 },
      { indicator: 'Regular', value: summary?.distributionJson?.regular ?? 0 },
      { indicator: 'Deficiente', value: summary?.distributionJson?.deficiente ?? 0 },
    ]);
    sheet.getRow(1).font = { bold: true };
  }

  private buildTeacherListSheet(
    workbook: ExcelJS.Workbook,
    results: EvaluationResult[],
    profileById: Map<string, PersonProfile>,
  ): void {
    const sheet = workbook.addWorksheet('Docentes');
    sheet.columns = [
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Cédula', key: 'cedula', width: 18 },
      { header: 'Puntuación', key: 'score', width: 14 },
      { header: 'Porcentaje', key: 'percentage', width: 14 },
      { header: 'Clasificación', key: 'classification', width: 16 },
      { header: 'Fecha de finalización', key: 'completedAt', width: 20 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const result of results) {
      const profile = profileById.get(result.evaluatedPersonId);
      const row = sheet.addRow({
        name: profile?.fullName ?? result.evaluatedPersonId,
        cedula: profile?.cedula ?? '—',
        score: Number(result.totalScore),
        percentage: Number(result.percentageScore),
        classification: result.classificationLabel ?? '—',
        completedAt: result.publishedAt ? result.publishedAt.toLocaleDateString('es-DO') : '—',
      });

      const fillColor = result.classificationLabel
        ? CLASSIFICATION_FILL_COLORS[result.classificationLabel]
        : undefined;
      if (fillColor) {
        row.getCell('classification').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor },
        };
      }
    }
  }
}

import { IsIn, IsObject, IsUUID } from 'class-validator';
import { REPORT_TYPE_VALUES } from '../constants/reports.constants';

export class RequestReportDto {
  @IsUUID()
  requestedBy: string;

  @IsIn(REPORT_TYPE_VALUES)
  reportType: string;

  @IsObject()
  parameters: Record<string, unknown>;
}

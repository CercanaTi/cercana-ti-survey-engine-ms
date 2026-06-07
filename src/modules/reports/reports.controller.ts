import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RequestReportDto } from './dto';
import { ReportRequest } from './entities/report-request.entity';

@ApiTags('Engine Reports')
@ApiSecurity('internal-api-key')
@Controller('engine/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Request the generation of a report' })
  @ApiResponse({ status: 201, description: 'Report generation queued' })
  @HttpCode(HttpStatus.CREATED)
  async requestReport(@Body() dto: RequestReportDto): Promise<ReportRequest> {
    return this.reportsService.requestReport(dto.requestedBy, dto.reportType, dto.parameters);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get the status of a report request' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Report request status' })
  async getStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId', ParseUUIDPipe) userId: string,
  ): Promise<ReportRequest> {
    return this.reportsService.getStatus(id, userId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get a signed download URL for a ready report' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Signed download URL' })
  async getDownloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ url: string; expiresAt: Date }> {
    return this.reportsService.getDownloadUrl(id, userId);
  }
}

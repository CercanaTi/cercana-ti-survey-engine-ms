import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { NodeAnalyticsSummary } from '../analytics/entities/node-analytics-summary.entity';
import { TeacherProgressSummary } from '../analytics/entities/teacher-progress-summary.entity';
import { NationalOverviewDto } from '../analytics/dto';
import { ResultsService } from './results.service';
import { EvaluationResult } from './entities/evaluation-result.entity';
import { SectionResult } from './entities/section-result.entity';

@ApiTags('Engine Results')
@ApiSecurity('internal-api-key')
@Controller('engine')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get('results/:id')
  @ApiOperation({ summary: 'Get a single evaluation result with its section breakdown' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Evaluation result with sections' })
  async getResult(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EvaluationResult & { sections: SectionResult[] }> {
    return this.resultsService.getResult(id);
  }

  @Get('results/person/:userId')
  @ApiOperation({ summary: 'Get all evaluation results for an evaluated person' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'surveyId', type: 'string', format: 'uuid', required: false })
  @ApiQuery({ name: 'period', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Evaluation results for the person' })
  async getResultsForPerson(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('surveyId') surveyId?: string,
    @Query('period') period?: string,
  ): Promise<EvaluationResult[]> {
    return this.resultsService.getResultsForPerson(userId, surveyId, period);
  }

  @Get('results/node/:nodeId')
  @ApiOperation({ summary: 'Get all evaluation results for a hierarchy node' })
  @ApiParam({ name: 'nodeId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'surveyId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'period', type: 'string' })
  @ApiResponse({ status: 200, description: 'Evaluation results for the node' })
  async getResultsForNode(
    @Param('nodeId', ParseUUIDPipe) nodeId: string,
    @Query('surveyId', ParseUUIDPipe) surveyId: string,
    @Query('period') period: string,
  ): Promise<EvaluationResult[]> {
    return this.resultsService.getResultsForNode(nodeId, surveyId, period);
  }

  @Get('analytics/node/:nodeId')
  @ApiOperation({ summary: 'Get the analytics summary for a hierarchy node' })
  @ApiParam({ name: 'nodeId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'surveyId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'period', type: 'string' })
  @ApiResponse({ status: 200, description: 'Node analytics summary' })
  async getNodeAnalytics(
    @Param('nodeId', ParseUUIDPipe) nodeId: string,
    @Query('surveyId', ParseUUIDPipe) surveyId: string,
    @Query('period') period: string,
  ): Promise<NodeAnalyticsSummary> {
    return this.resultsService.getNodeAnalytics(nodeId, surveyId, period);
  }

  @Get('analytics/teacher/:userId')
  @ApiOperation({ summary: 'Get the progress summary for an evaluated teacher' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'surveyId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'period', type: 'string' })
  @ApiResponse({ status: 200, description: 'Teacher progress summary' })
  async getTeacherProgress(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('surveyId', ParseUUIDPipe) surveyId: string,
    @Query('period') period: string,
  ): Promise<TeacherProgressSummary> {
    return this.resultsService.getTeacherProgress(userId, surveyId, period);
  }

  @Get('analytics/national')
  @ApiOperation({ summary: 'Get the national overview for a survey period' })
  @ApiQuery({ name: 'surveyId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'period', type: 'string' })
  @ApiResponse({ status: 200, description: 'National overview' })
  async getNationalOverview(
    @Query('surveyId', ParseUUIDPipe) surveyId: string,
    @Query('period') period: string,
  ): Promise<NationalOverviewDto> {
    return this.resultsService.getNationalOverview(surveyId, period);
  }
}

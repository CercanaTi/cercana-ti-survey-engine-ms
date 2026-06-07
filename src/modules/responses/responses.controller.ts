import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponsesService } from './responses.service';
import { ReceiveEvaluationDto } from './dto/receive-evaluation.dto';
import { SaveDraftDto } from './dto/save-draft.dto';
import { ResponseStatusDto } from './dto/response-status.dto';

@ApiTags('Engine Responses')
@ApiSecurity('internal-api-key')
@Controller('engine/responses')
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Post()
  @ApiOperation({ summary: 'Receive a completed evaluation response for async processing' })
  @ApiResponse({ status: 201, description: 'Evaluation response queued for processing' })
  @HttpCode(HttpStatus.CREATED)
  async receive(
    @Body() dto: ReceiveEvaluationDto,
  ): Promise<{ responseId: string; status: 'queued' }> {
    return this.responsesService.receive(dto);
  }

  @Post('draft')
  @ApiOperation({ summary: 'Save partial answers as a draft' })
  @ApiResponse({ status: 201, description: 'Draft saved' })
  @HttpCode(HttpStatus.CREATED)
  async saveDraft(@Body() dto: SaveDraftDto): Promise<{ responseId: string }> {
    return this.responsesService.saveDraft(dto);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get the processing status of an evaluation response' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Processing status' })
  async getStatus(@Param('id', ParseUUIDPipe) id: string): Promise<ResponseStatusDto> {
    return this.responsesService.getStatus(id);
  }
}

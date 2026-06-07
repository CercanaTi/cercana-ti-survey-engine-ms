import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiResponse({ status: 200, description: 'Health check successful' })
  getHealth(): { status: string; timestamp: string; service: string } {
    return this.appService.getHealth();
  }

  @Public()
  @Get('health')
  @ApiResponse({ status: 200, description: 'Detailed health check' })
  getDetailedHealth() {
    return this.appService.getDetailedHealth();
  }
}

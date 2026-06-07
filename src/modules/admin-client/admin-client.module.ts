import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminClientService } from './admin-client.service';

@Module({
  imports: [HttpModule],
  providers: [AdminClientService],
  exports: [AdminClientService],
})
export class AdminClientModule {}

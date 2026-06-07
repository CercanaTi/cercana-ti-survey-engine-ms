import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CommonHttpService } from './common-http.service';
import { CommonHttpModule } from '../http/http.module';

@Module({
  imports: [HttpModule, CommonHttpModule],
  providers: [CommonHttpService],
  exports: [CommonHttpService],
})
export class AxiosModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpClientService } from './services/http-client.service';
import { AxiosHttpService } from './services/axios-http.service';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: HttpClientService,
      useClass: AxiosHttpService,
    },
  ],
  exports: [HttpClientService],
})
export class CommonHttpModule {}

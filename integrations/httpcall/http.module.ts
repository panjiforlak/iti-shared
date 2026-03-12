import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpCallService } from './http.service';

@Module({
  imports: [HttpModule],
  providers: [HttpCallService],
  exports: [HttpCallService],
})
export class HttpCallModule {}

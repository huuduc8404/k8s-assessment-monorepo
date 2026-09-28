import { Module } from '@nestjs/common';
import { UploadResolver } from './upload.resolver';
import { UploadService } from './upload.service';
import { VideoModule } from '../video/video.module';

@Module({
  imports: [VideoModule],
  providers: [UploadResolver, UploadService],
  exports: [UploadService],
})
export class UploadModule {}
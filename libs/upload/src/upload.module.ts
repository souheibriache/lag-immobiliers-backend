import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadProvider } from './providers/upload.provider';
import { UploadController } from './upload.controller';
import { ConfigModule } from '@app/config';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService, UploadProvider],
  exports: [UploadService, UploadProvider],
})
export class UploadModule {}

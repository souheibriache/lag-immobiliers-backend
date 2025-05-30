import { Module } from '@nestjs/common';
import { AccompaniementService } from './accompaniement.service';
import { AccompaniementController } from './accompaniement.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accompaniement } from './entities/accompaniement.entity';
import { Media } from '@app/media/entities';
import { UploadModule } from '@app/upload';
import { MediaModule } from '@app/media';

@Module({
  imports: [
    TypeOrmModule.forFeature([Accompaniement, Media]),
    UploadModule,
    MediaModule,
  ],
  controllers: [AccompaniementController],
  providers: [AccompaniementService],
})
export class AccompaniementModule {}

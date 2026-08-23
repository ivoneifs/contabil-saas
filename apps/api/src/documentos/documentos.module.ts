import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentosService } from './documentos.service';
import { DocumentosController } from './documentos.controller';

@Module({
  imports: [MulterModule.register({ storage: memoryStorage() })],
  providers: [DocumentosService],
  controllers: [DocumentosController],
})
export class DocumentosModule {}

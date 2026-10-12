import { Module } from '@nestjs/common';
import { DocumentosFiscaisService } from './documentos-fiscais.service';
import { DocumentosFiscaisController } from './documentos-fiscais.controller';

@Module({
  providers: [DocumentosFiscaisService],
  controllers: [DocumentosFiscaisController],
})
export class DocumentosFiscaisModule {}

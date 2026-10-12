import { Module } from '@nestjs/common';
import { CertificadosService } from './certificados.service';
import { CertificadosController } from './certificados.controller';

@Module({
  providers: [CertificadosService],
  controllers: [CertificadosController],
  exports: [CertificadosService],
})
export class CertificadosModule {}

import { Module } from '@nestjs/common';
import { IntegracoesService } from './integracoes.service';
import { IntegracoesController } from './integracoes.controller';
import { ConsultasModule } from '../consultas/consultas.module';
import { CertificadosModule } from '../certificados/certificados.module';

@Module({
  imports: [ConsultasModule, CertificadosModule],
  providers: [IntegracoesService],
  controllers: [IntegracoesController],
})
export class IntegracoesModule {}

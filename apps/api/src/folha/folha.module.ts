import { Module } from '@nestjs/common';
import { ConsultasModule } from '../consultas/consultas.module';
import { FolhaService } from './folha.service';
import { EsocialService } from './esocial.service';
import { FolhaController } from './folha.controller';

@Module({
  imports: [ConsultasModule],
  providers: [FolhaService, EsocialService],
  controllers: [FolhaController],
  exports: [EsocialService],
})
export class FolhaModule {}

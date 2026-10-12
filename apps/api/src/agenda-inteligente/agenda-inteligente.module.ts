import { Module } from '@nestjs/common';
import { ConsultasModule } from '../consultas/consultas.module';
import { AssistenteModule } from '../assistente/assistente.module';
import { AgendaInteligenteService } from './agenda-inteligente.service';
import { AgendaInteligenteController } from './agenda-inteligente.controller';

@Module({
  imports: [ConsultasModule, AssistenteModule],
  providers: [AgendaInteligenteService],
  controllers: [AgendaInteligenteController],
})
export class AgendaInteligenteModule {}

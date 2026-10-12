import { Module } from '@nestjs/common';
import { EquipeModule } from '../equipe/equipe.module';
import { ContadoresService } from './contadores.service';
import { ContadoresController } from './contadores.controller';

@Module({
  imports: [EquipeModule],
  providers: [ContadoresService],
  controllers: [ContadoresController],
  exports: [ContadoresService],
})
export class ContadoresModule {}

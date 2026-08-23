import { Module } from '@nestjs/common';
import { IntegracoesService } from './integracoes.service';
import { IntegracoesController } from './integracoes.controller';

@Module({
  providers: [IntegracoesService],
  controllers: [IntegracoesController],
})
export class IntegracoesModule {}

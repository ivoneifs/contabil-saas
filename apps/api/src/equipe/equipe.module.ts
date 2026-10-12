import { Module } from '@nestjs/common';
import { EquipeService } from './equipe.service';
import { EquipeController } from './equipe.controller';

@Module({
  providers: [EquipeService],
  controllers: [EquipeController],
  exports: [EquipeService],
})
export class EquipeModule {}

import { Module } from '@nestjs/common';
import { AssistenteService } from './assistente.service';
import { AssistenteController } from './assistente.controller';

@Module({
  providers: [AssistenteService],
  controllers: [AssistenteController],
  exports: [AssistenteService],
})
export class AssistenteModule {}

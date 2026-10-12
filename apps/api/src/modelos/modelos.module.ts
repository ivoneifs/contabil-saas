import { Module } from '@nestjs/common';
import { AssistenteModule } from '../assistente/assistente.module';
import { ModelosService } from './modelos.service';
import { ModelosController } from './modelos.controller';

@Module({
  imports: [AssistenteModule],
  providers: [ModelosService],
  controllers: [ModelosController],
})
export class ModelosModule {}

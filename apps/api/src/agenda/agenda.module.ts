import { Module } from '@nestjs/common';
import { CompromissosService } from './compromissos.service';
import { CompromissosController } from './compromissos.controller';

@Module({
  providers: [CompromissosService],
  controllers: [CompromissosController],
})
export class AgendaModule {}

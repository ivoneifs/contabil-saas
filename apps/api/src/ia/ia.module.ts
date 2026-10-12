import { Global, Module } from '@nestjs/common';
import { IaService } from './ia.service';
import { ChavesIaService } from './chaves-ia.service';
import { ChavesIaController } from './chaves-ia.controller';

@Global()
@Module({
  providers: [IaService, ChavesIaService],
  controllers: [ChavesIaController],
  exports: [IaService],
})
export class IaModule {}

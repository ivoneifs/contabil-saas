import { Module } from '@nestjs/common';
import { NotasFiscaisService } from './notas-fiscais.service';
import { NotasFiscaisController } from './notas-fiscais.controller';
import { FISCAL_GATEWAY } from './gateways/fiscal-gateway.interface';
import { FocusNfeGateway } from './gateways/focus-nfe.gateway';

@Module({
  providers: [
    NotasFiscaisService,
    { provide: FISCAL_GATEWAY, useClass: FocusNfeGateway },
  ],
  controllers: [NotasFiscaisController],
})
export class FiscalModule {}

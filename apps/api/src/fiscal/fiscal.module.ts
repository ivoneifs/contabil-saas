import { Module } from '@nestjs/common';
import { NotasFiscaisService } from './notas-fiscais.service';
import { NotasFiscaisController } from './notas-fiscais.controller';
import { ObrigacoesFiscaisService } from './obrigacoes-fiscais.service';
import { ObrigacoesFiscaisController } from './obrigacoes-fiscais.controller';
import { FISCAL_GATEWAY } from './gateways/fiscal-gateway.interface';
import { FocusNfeGateway } from './gateways/focus-nfe.gateway';

@Module({
  providers: [
    NotasFiscaisService,
    ObrigacoesFiscaisService,
    { provide: FISCAL_GATEWAY, useClass: FocusNfeGateway },
  ],
  controllers: [NotasFiscaisController, ObrigacoesFiscaisController],
})
export class FiscalModule {}

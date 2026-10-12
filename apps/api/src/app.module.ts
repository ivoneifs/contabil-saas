import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { FiscalModule } from './fiscal/fiscal.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { PessoalModule } from './pessoal/pessoal.module';
import { AgendaModule } from './agenda/agenda.module';
import { DocumentosModule } from './documentos/documentos.module';
import { AssistenteModule } from './assistente/assistente.module';
import { IntegracoesModule } from './integracoes/integracoes.module';
import { AdminModule } from './admin/admin.module';
import { CertificadosModule } from './certificados/certificados.module';
import { ConsultasModule } from './consultas/consultas.module';
import { PainelModule } from './painel/painel.module';
import { AgendaInteligenteModule } from './agenda-inteligente/agenda-inteligente.module';
import { ModelosModule } from './modelos/modelos.module';
import { IaModule } from './ia/ia.module';
import { PlataformaModule } from './plataforma/plataforma.module';
import { DocumentosFiscaisModule } from './documentos-fiscais/documentos-fiscais.module';
import { EquipeModule } from './equipe/equipe.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    IaModule,
    AuthModule,
    ClientsModule,
    FiscalModule,
    FinanceiroModule,
    PessoalModule,
    AgendaModule,
    DocumentosModule,
    AssistenteModule,
    IntegracoesModule,
    AdminModule,
    CertificadosModule,
    ConsultasModule,
    PainelModule,
    AgendaInteligenteModule,
    ModelosModule,
    PlataformaModule,
    DocumentosFiscaisModule,
    EquipeModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

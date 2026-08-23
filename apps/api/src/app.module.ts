import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { FiscalModule } from './fiscal/fiscal.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { PessoalModule } from './pessoal/pessoal.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    FiscalModule,
    FinanceiroModule,
    PessoalModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

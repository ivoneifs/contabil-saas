import { Module } from '@nestjs/common';
import { FolhaModule } from '../folha/folha.module';
import { FuncionariosService } from './funcionarios.service';
import { FuncionariosController } from './funcionarios.controller';

@Module({
  imports: [FolhaModule],
  providers: [FuncionariosService],
  controllers: [FuncionariosController],
})
export class PessoalModule {}

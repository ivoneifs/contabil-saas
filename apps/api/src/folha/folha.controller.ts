import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsEnum, IsIn, IsNumber, IsObject, IsOptional, IsString, Matches, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissoesGuard, Requer } from '../auth/permissoes.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { FolhaService } from './folha.service';
import { EsocialService } from './esocial.service';

class AbrirFolhaDto {
  @IsString() clientId: string;
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) competencia: string;
}

class LancamentosDto {
  @IsNumber() @Min(0) horasExtras50: number;
  @IsNumber() @Min(0) horasExtras100: number;
  @IsNumber() @Min(0) faltasDias: number;
  @IsArray() outrosProventos: { descricao: string; valor: number; tributavel?: boolean }[];
  @IsArray() outrosDescontos: { descricao: string; valor: number }[];
}

class CalculoDto {
  @IsString() funcionarioId: string;
  @IsIn(['FERIAS', 'RESCISAO', 'DECIMO_TERCEIRO']) tipo: 'FERIAS' | 'RESCISAO' | 'DECIMO_TERCEIRO';
  @IsObject() parametros: Record<string, unknown>;
  @IsOptional() @IsBoolean() salvar?: boolean;
}

class EventoDto {
  @IsEnum(['PENDENTE', 'ENVIADO', 'DISPENSADO']) status: 'PENDENTE' | 'ENVIADO' | 'DISPENSADO';
  @IsOptional() @IsString() recibo?: string;
  @IsOptional() @IsString() observacao?: string;
}

@UseGuards(JwtAuthGuard, PermissoesGuard)
@Requer('pessoal')
@Controller()
export class FolhaController {
  constructor(
    private readonly folha: FolhaService,
    private readonly esocial: EsocialService,
  ) {}

  @Get('folha/tabelas')
  tabelas() {
    return this.folha.tabelas();
  }

  @Get('folha/encargos')
  encargos(@CurrentUser() u: JwtPayload, @Query('competencia') competencia: string) {
    return this.folha.encargos(u.organizationId, competencia);
  }

  @Get('folha')
  listar(@CurrentUser() u: JwtPayload, @Query('competencia') competencia?: string, @Query('clientId') clientId?: string) {
    return this.folha.listar(u.organizationId, { competencia, clientId });
  }

  @Post('folha/abrir')
  @HttpCode(200)
  abrir(@CurrentUser() u: JwtPayload, @Body() dto: AbrirFolhaDto) {
    return this.folha.abrir(u.organizationId, dto.clientId, dto.competencia);
  }

  @Get('folha/:id')
  detalhe(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.folha.detalhe(u.organizationId, id);
  }

  @Patch('folha/:id/itens/:itemId')
  atualizarItem(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: LancamentosDto) {
    return this.folha.atualizarItem(u.organizationId, id, itemId, dto);
  }

  @Post('folha/:id/recalcular')
  @HttpCode(200)
  recalcular(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.folha.recalcular(u.organizationId, id);
  }

  @Post('folha/:id/fechar')
  @HttpCode(200)
  fechar(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.folha.fechar(u.organizationId, id);
  }

  @Post('folha/:id/reabrir')
  @HttpCode(200)
  reabrir(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.folha.reabrir(u.organizationId, id);
  }

  @Delete('folha/:id')
  excluir(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.folha.excluir(u.organizationId, id);
  }

  @Post('calculos-trabalhistas')
  @HttpCode(200)
  calcular(@CurrentUser() u: JwtPayload, @Body() dto: CalculoDto) {
    return this.folha.calcular(u.organizationId, dto.funcionarioId, dto.tipo, dto.parametros, !!dto.salvar);
  }

  @Get('calculos-trabalhistas')
  listarCalculos(@CurrentUser() u: JwtPayload, @Query('funcionarioId') funcionarioId?: string, @Query('tipo') tipo?: string) {
    return this.folha.listarCalculos(u.organizationId, { funcionarioId, tipo });
  }

  @Get('calculos-trabalhistas/:id')
  obterCalculo(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.folha.obterCalculo(u.organizationId, id);
  }

  @Delete('calculos-trabalhistas/:id')
  excluirCalculo(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.folha.excluirCalculo(u.organizationId, id);
  }

  @Get('esocial/eventos')
  eventos(@CurrentUser() u: JwtPayload, @Query('status') status?: string, @Query('clientId') clientId?: string) {
    return this.esocial.listar(u.organizationId, { status, clientId });
  }

  @Patch('esocial/eventos/:id')
  atualizarEvento(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: EventoDto) {
    return this.esocial.atualizar(u.organizationId, id, dto);
  }
}

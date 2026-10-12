import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ProvedorIa } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { ChavesIaService } from './chaves-ia.service';

class CriarChaveDto {
  @IsEnum(ProvedorIa)
  provedor: ProvedorIa;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nome: string;

  @IsString()
  @MinLength(10)
  chave: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  modelo?: string;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;

  @IsOptional()
  @IsBoolean()
  padrao?: boolean;
}

class AtualizarChaveDto {
  @IsOptional()
  @IsEnum(ProvedorIa)
  provedor?: ProvedorIa;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  nome?: string;

  @IsOptional()
  @IsString()
  chave?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  modelo?: string;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;

  @IsOptional()
  @IsBoolean()
  padrao?: boolean;
}

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/chaves-ia')
export class ChavesIaController {
  constructor(private readonly service: ChavesIaService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Post()
  criar(@Body() dto: CriarChaveDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarChaveDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.service.remover(id);
  }

  @Post(':id/testar')
  testar(@Param('id') id: string) {
    return this.service.testar(id);
  }
}

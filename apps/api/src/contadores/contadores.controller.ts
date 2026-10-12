import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Length, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { CategoriaCrc } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissoesGuard, Requer } from '../auth/permissoes.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ContadoresService } from './contadores.service';

class ContadorDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(120) nome?: string;
  @IsOptional() @IsString() cpf?: string;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(20) crcNumero?: string;
  @IsOptional() @IsString() @Length(2, 2) crcUf?: string;
  @IsOptional() @IsEnum(CategoriaCrc) categoria?: CategoriaCrc;
  @IsOptional() @ValidateIf((_, v) => !!v) @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(30) telefone?: string;
  @IsOptional() @IsBoolean() principal?: boolean;
  // { senha } dá acesso; false retira. Validado no serviço.
  @IsOptional() acesso?: { senha?: string } | false;
}

class CriarContadorDto extends ContadorDto {
  @IsString() @MinLength(3) @MaxLength(120) declare nome: string;
  @IsString() declare cpf: string;
  @IsString() @MinLength(3) @MaxLength(20) declare crcNumero: string;
  @IsString() @Length(2, 2) declare crcUf: string;
}

@UseGuards(JwtAuthGuard, PermissoesGuard)
@Requer('clientes.ver')
@Controller('contadores')
export class ContadoresController {
  constructor(private readonly service: ContadoresService) {}

  @Get()
  listar(@CurrentUser() u: JwtPayload) {
    return this.service.listar(u.organizationId);
  }

  @Get(':id/clientes')
  carteira(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.service.carteira(u.organizationId, id);
  }

  // Cadastro de contadores e acesso ao sistema: só o administrador.
  @Post()
  @Requer('equipe')
  criar(@CurrentUser() u: JwtPayload, @Body() dto: CriarContadorDto) {
    return this.service.criar(u.organizationId, u.sub, dto);
  }

  @Patch(':id')
  @Requer('equipe')
  atualizar(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: ContadorDto) {
    return this.service.atualizar(u.organizationId, u.sub, id, dto);
  }

  @Delete(':id')
  @Requer('equipe')
  remover(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.service.remover(u.organizationId, u.sub, id);
  }
}

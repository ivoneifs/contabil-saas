import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MembershipRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { AdminService } from './admin.service';

class EscritorioDto {
  @IsOptional() @IsString() @MaxLength(120) nome?: string;
  @IsOptional() @IsString() cnpj?: string;
  @IsOptional() @IsString() @MaxLength(30) telefone?: string;
  @IsOptional() @IsString() @MaxLength(60) plano?: string;
  @IsOptional() @IsDateString() acessoAte?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) observacoes?: string;
  @IsOptional() @IsBoolean() ativa?: boolean;
}

class CriarEscritorioDto extends EscritorioDto {
  @IsString() @MinLength(2) @MaxLength(120) declare nome: string;
  @IsString() @MinLength(2) adminNome: string;
  @IsEmail() adminEmail: string;
  @IsString() @MinLength(8) adminSenha: string;
}

class ExcluirDto {
  @IsString() confirmacao: string;
}

class UsuarioDto {
  @IsOptional() @IsString() @MinLength(2) nome?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(8) senha?: string;
  @IsOptional() @IsEnum(MembershipRole) papel?: MembershipRole;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

class CriarUsuarioDto extends UsuarioDto {
  @IsString() @MinLength(2) declare nome: string;
  @IsEmail() declare email: string;
  @IsString() @MinLength(8) declare senha: string;
}

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('resumo')
  resumo() {
    return this.admin.resumo();
  }

  @Get('organizations')
  listar() {
    return this.admin.listarEscritorios();
  }

  @Post('organizations')
  criar(@Body() dto: CriarEscritorioDto) {
    return this.admin.criarEscritorio(dto);
  }

  @Patch('organizations/:id')
  atualizar(@Param('id') id: string, @Body() dto: EscritorioDto) {
    return this.admin.atualizarEscritorio(id, dto);
  }

  @Post('organizations/:id/excluir')
  excluir(@Param('id') id: string, @Body() dto: ExcluirDto) {
    return this.admin.excluirEscritorio(id, dto.confirmacao);
  }

  @Post('organizations/:id/acessar')
  acessar(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.admin.acessar(user.sub, id);
  }

  @Get('organizations/:id/usuarios')
  usuarios(@Param('id') id: string) {
    return this.admin.listarUsuarios(id);
  }

  @Post('organizations/:id/usuarios')
  criarUsuario(@Param('id') id: string, @Body() dto: CriarUsuarioDto) {
    return this.admin.criarUsuario(id, dto);
  }

  @Patch('organizations/:id/usuarios/:userId')
  atualizarUsuario(@Param('id') id: string, @Param('userId') userId: string, @Body() dto: UsuarioDto) {
    return this.admin.atualizarUsuario(id, userId, dto);
  }

  @Delete('organizations/:id/usuarios/:userId')
  removerUsuario(@Param('id') id: string, @Param('userId') userId: string) {
    return this.admin.removerUsuario(id, userId);
  }
}

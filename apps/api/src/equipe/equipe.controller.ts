import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { MembershipRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissoesGuard, Requer } from '../auth/permissoes.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { EquipeService } from './equipe.service';

class MembroDto {
  @IsOptional() @IsString() @MinLength(2) nome?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(8) senha?: string;
  @IsOptional() @IsEnum(MembershipRole) papel?: MembershipRole;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsArray() @IsString({ each: true }) permissoes?: string[] | null;
}

class CriarMembroDto extends MembroDto {
  @IsString() @MinLength(2) declare nome: string;
  @IsEmail() declare email: string;
  @IsString() @MinLength(8) declare senha: string;
}

@UseGuards(JwtAuthGuard, PermissoesGuard)
@Requer('equipe')
@Controller('equipe')
export class EquipeController {
  constructor(private readonly service: EquipeService) {}

  @Get('catalogo')
  catalogo() {
    return this.service.catalogo();
  }

  @Get()
  listar(@CurrentUser() user: JwtPayload) {
    return this.service.listar(user.organizationId);
  }

  @Post()
  criar(@CurrentUser() user: JwtPayload, @Body() dto: CriarMembroDto) {
    return this.service.criar(user.organizationId, dto);
  }

  @Patch(':userId')
  atualizar(@CurrentUser() user: JwtPayload, @Param('userId') userId: string, @Body() dto: MembroDto) {
    return this.service.atualizar(user.organizationId, user.sub, userId, dto);
  }

  @Delete(':userId')
  remover(@CurrentUser() user: JwtPayload, @Param('userId') userId: string) {
    return this.service.remover(user.organizationId, user.sub, userId);
  }
}

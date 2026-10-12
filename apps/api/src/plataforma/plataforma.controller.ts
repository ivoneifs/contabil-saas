import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { PlataformaService } from './plataforma.service';

const HEX = /^#[0-9a-fA-F]{6}$/;

class AtualizarPlataformaDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  nomeSistema?: string;

  @IsOptional()
  @Matches(HEX, { message: 'corPrimaria deve ser #rrggbb' })
  corPrimaria?: string;

  @IsOptional()
  @Matches(HEX, { message: 'corSecundaria deve ser #rrggbb' })
  corSecundaria?: string;

  @IsOptional()
  @Matches(HEX, { message: 'corDestaque deve ser #rrggbb' })
  corDestaque?: string;

  @IsOptional()
  @Matches(/^\d{12,13}$/, { message: 'WhatsApp com DDI e DDD, só números (ex.: 5574988258825)' })
  whatsapp?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  precoAVista?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  parcelas?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  valorParcela?: number;
}

// Leitura pública: a landing, o login e o painel usam nome, cores e WhatsApp.
@Controller('plataforma')
export class PlataformaPublicaController {
  constructor(private readonly service: PlataformaService) {}

  @Get('config')
  config() {
    return this.service.obter();
  }
}

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/plataforma')
export class PlataformaAdminController {
  constructor(private readonly service: PlataformaService) {}

  @Patch()
  atualizar(@Body() dto: AtualizarPlataformaDto) {
    return this.service.atualizar(dto);
  }

  @Post('restaurar')
  restaurar() {
    return this.service.restaurarPadrao();
  }
}

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissoesGuard, Requer } from '../auth/permissoes.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { AgendaInteligenteService } from './agenda-inteligente.service';

class GerarDto {
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  competencia: string;
}

@UseGuards(JwtAuthGuard, PermissoesGuard)
@Requer('obrigacoes')
@Controller('agenda-inteligente')
export class AgendaInteligenteController {
  constructor(private readonly service: AgendaInteligenteService) {}

  @Get('regras')
  regras() {
    return this.service.regras();
  }

  @Post('gerar')
  gerar(@CurrentUser() user: JwtPayload, @Body() dto: GerarDto) {
    return this.service.gerar(user.organizationId, dto.competencia);
  }

  @Post('plano')
  plano(@CurrentUser() user: JwtPayload) {
    return this.service.plano(user.organizationId);
  }
}

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ModelosService } from './modelos.service';

class GerarModeloDto {
  @IsString()
  modeloId: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instrucoes?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('modelos')
export class ModelosController {
  constructor(private readonly service: ModelosService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Post('gerar')
  gerar(@CurrentUser() user: JwtPayload, @Body() dto: GerarModeloDto) {
    return this.service.gerar(user.organizationId, dto.modeloId, dto.clientId, dto.instrucoes);
  }
}

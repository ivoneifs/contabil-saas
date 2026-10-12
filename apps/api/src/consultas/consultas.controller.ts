import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsultasService } from './consultas.service';

@UseGuards(JwtAuthGuard)
@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  @Get('cnpj/:cnpj')
  cnpj(@Param('cnpj') cnpj: string) {
    return this.consultasService.cnpj(cnpj);
  }

  @Get('cep/:cep')
  cep(@Param('cep') cep: string) {
    return this.consultasService.cep(cep);
  }

  @Get('feriados/:ano')
  feriados(@Param('ano', ParseIntPipe) ano: number) {
    return this.consultasService.feriados(ano);
  }

  @Get('indices')
  indices() {
    return this.consultasService.indices();
  }
}

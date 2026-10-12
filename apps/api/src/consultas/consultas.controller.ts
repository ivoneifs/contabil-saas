import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
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

  @Get('cambio')
  cambio() {
    return this.consultasService.cambio();
  }

  @Get('municipios/:uf')
  municipios(@Param('uf') uf: string) {
    return this.consultasService.municipios(uf);
  }

  @Get('cnae/:codigo')
  cnae(@Param('codigo') codigo: string) {
    return this.consultasService.cnae(codigo);
  }

  @Get('ncm')
  ncm(@Query('busca') busca = '') {
    return this.consultasService.ncm(busca);
  }

  @Get('sefaz-status')
  statusSefaz() {
    return this.consultasService.statusSefaz();
  }

  @Get('indices')
  indices() {
    return this.consultasService.indices();
  }
}

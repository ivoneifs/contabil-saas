import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { NotasFiscaisService } from './notas-fiscais.service';
import { CreateNotaFiscalDto } from './dto/create-nota-fiscal.dto';

@UseGuards(JwtAuthGuard)
@Controller('notas-fiscais')
export class NotasFiscaisController {
  constructor(private readonly notasFiscaisService: NotasFiscaisService) {}

  @Post()
  emitir(@CurrentUser() user: JwtPayload, @Body() dto: CreateNotaFiscalDto) {
    return this.notasFiscaisService.emitir(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query('clientId') clientId?: string) {
    return this.notasFiscaisService.findAll(user.organizationId, clientId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notasFiscaisService.findOne(user.organizationId, id);
  }

  @Post(':id/atualizar-status')
  atualizarStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notasFiscaisService.atualizarStatus(user.organizationId, id);
  }
}

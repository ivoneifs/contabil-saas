import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ObrigacoesFiscaisService } from './obrigacoes-fiscais.service';
import { CreateObrigacaoFiscalDto } from './dto/create-obrigacao-fiscal.dto';
import { UpdateObrigacaoFiscalDto } from './dto/update-obrigacao-fiscal.dto';

@UseGuards(JwtAuthGuard)
@Controller('obrigacoes-fiscais')
export class ObrigacoesFiscaisController {
  constructor(private readonly obrigacoesFiscaisService: ObrigacoesFiscaisService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateObrigacaoFiscalDto) {
    return this.obrigacoesFiscaisService.create(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.obrigacoesFiscaisService.findAll(user.organizationId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateObrigacaoFiscalDto,
  ) {
    return this.obrigacoesFiscaisService.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.obrigacoesFiscaisService.remove(user.organizationId, id);
  }
}

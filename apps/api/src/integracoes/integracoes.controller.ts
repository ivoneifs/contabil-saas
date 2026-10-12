import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissoesGuard, Requer } from '../auth/permissoes.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { IntegracoesService } from './integracoes.service';
import { UpdateIntegracoesDto } from './dto/update-integracoes.dto';

@UseGuards(JwtAuthGuard, PermissoesGuard)
@Controller('integracoes')
export class IntegracoesController {
  constructor(private readonly integracoesService: IntegracoesService) {}

  @Get()
  @Requer('integracoes')
  get(@CurrentUser() user: JwtPayload) {
    return this.integracoesService.get(user.organizationId);
  }

  @Get('catalogo')
  catalogo(@CurrentUser() user: JwtPayload) {
    return this.integracoesService.catalogo(user.organizationId);
  }

  @Post()
  @Requer('integracoes')
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateIntegracoesDto) {
    return this.integracoesService.update(user.organizationId, dto);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { LancamentosService } from './lancamentos.service';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { UpdateLancamentoDto } from './dto/update-lancamento.dto';

@UseGuards(JwtAuthGuard)
@Controller('lancamentos')
export class LancamentosController {
  constructor(private readonly lancamentosService: LancamentosService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLancamentoDto) {
    return this.lancamentosService.create(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query('clientId') clientId?: string) {
    return this.lancamentosService.findAll(user.organizationId, clientId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.lancamentosService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLancamentoDto,
  ) {
    return this.lancamentosService.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.lancamentosService.remove(user.organizationId, id);
  }
}

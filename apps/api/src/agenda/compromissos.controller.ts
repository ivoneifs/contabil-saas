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
import { CompromissosService } from './compromissos.service';
import { CreateCompromissoDto } from './dto/create-compromisso.dto';
import { UpdateCompromissoDto } from './dto/update-compromisso.dto';

@UseGuards(JwtAuthGuard)
@Controller('compromissos')
export class CompromissosController {
  constructor(private readonly compromissosService: CompromissosService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCompromissoDto) {
    return this.compromissosService.create(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query('clientId') clientId?: string) {
    return this.compromissosService.findAll(user.organizationId, clientId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.compromissosService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCompromissoDto,
  ) {
    return this.compromissosService.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.compromissosService.remove(user.organizationId, id);
  }
}

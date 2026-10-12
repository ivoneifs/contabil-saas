import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissoesGuard, Requer } from '../auth/permissoes.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ImportarClientesDto } from './dto/importar-clientes.dto';

@UseGuards(JwtAuthGuard, PermissoesGuard)
@Requer('clientes.ver')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Requer('clientes.gerenciar')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateClientDto) {
    return this.clientsService.create(user.organizationId, dto);
  }

  @Post('importar')
  @Requer('clientes.gerenciar')
  importar(@CurrentUser() user: JwtPayload, @Body() dto: ImportarClientesDto) {
    const itens = [...(dto.itens ?? []), ...(dto.cnpjs ?? []).map((documento) => ({ documento }))];
    return this.clientsService.importar(user.organizationId, itens, dto.ufPadrao, dto.contadorId);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.clientsService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.clientsService.findOne(user.organizationId, id);
  }

  @Patch(':id')
  @Requer('clientes.gerenciar')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  @Requer('clientes.excluir')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.clientsService.remove(user.organizationId, id);
  }
}

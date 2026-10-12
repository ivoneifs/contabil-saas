import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissoesGuard, Requer } from '../auth/permissoes.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { DocumentosService } from './documentos.service';
import { DocumentoCategoria } from '@prisma/client';

@UseGuards(JwtAuthGuard, PermissoesGuard)
@Requer('documentos')
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body('clientId') clientId: string,
    @Body('categoria') categoria?: DocumentoCategoria,
  ) {
    return this.documentosService.upload(user.organizationId, clientId, categoria, file);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query('clientId') clientId?: string) {
    return this.documentosService.findAll(user.organizationId, clientId);
  }

  @Get(':id/conteudo')
  async download(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const documento = await this.documentosService.findConteudo(user.organizationId, id);
    res.setHeader('Content-Type', documento.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${documento.nomeArquivo}"`);
    res.send(documento.conteudo);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.documentosService.remove(user.organizationId, id);
  }
}

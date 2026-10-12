import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { DirecaoDocFiscal, FormatoArquivoFiscal, ModeloDocFiscal } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissoesGuard, Requer } from '../auth/permissoes.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { DocumentosFiscaisService } from './documentos-fiscais.service';

class FiltrosDto {
  @IsOptional() @IsEnum(ModeloDocFiscal) modelo?: ModeloDocFiscal;
  @IsOptional() @IsEnum(FormatoArquivoFiscal) formato?: FormatoArquivoFiscal;
  @IsOptional() @IsEnum(DirecaoDocFiscal) direcao?: DirecaoDocFiscal;
  @IsOptional() @IsString() clientId?: string;
  @IsOptional() @IsString() situacao?: string;
  @IsOptional() @IsString() de?: string;
  @IsOptional() @IsString() ate?: string;
  @IsOptional() @IsString() busca?: string;
}

class ListarDto extends FiltrosDto {
  @IsOptional() @Type(() => Number) pagina?: number;
  @IsOptional() @Type(() => Number) porPagina?: number;
}

class ExportarDto extends FiltrosDto {
  @IsOptional() @IsArray() @ArrayMaxSize(2000) @IsString({ each: true }) ids?: string[];
}

class IdsDto {
  @IsArray() @ArrayMaxSize(2000) @IsString({ each: true }) ids: string[];
}

class VincularDto {
  @IsOptional() @IsString() clientId?: string | null;
}

@UseGuards(JwtAuthGuard, PermissoesGuard)
@Requer('fiscal.ver')
@Controller('documentos-fiscais')
export class DocumentosFiscaisController {
  constructor(private readonly service: DocumentosFiscaisService) {}

  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(FilesInterceptor('files', 200, { limits: { fileSize: 100 * 1024 * 1024 } }))
  @Requer('fiscal.enviar')
  upload(@CurrentUser() user: JwtPayload, @UploadedFiles() files: Express.Multer.File[], @Body('clientId') clientId?: string) {
    // multer entrega o nome em latin1; converte para UTF-8 (acentos).
    const arquivos = (files ?? []).map((f) => ({ nome: Buffer.from(f.originalname, 'latin1').toString('utf8'), conteudo: f.buffer }));
    return this.service.importar(user.organizationId, arquivos, clientId || undefined);
  }

  @Get()
  listar(@CurrentUser() user: JwtPayload, @Query() q: ListarDto) {
    const { pagina, porPagina, ...filtros } = q;
    return this.service.listar(user.organizationId, filtros, pagina ?? 1, porPagina ?? 50);
  }

  @Get('resumo')
  resumo(@CurrentUser() user: JwtPayload) {
    return this.service.resumo(user.organizationId);
  }

  @Post('exportar')
  @HttpCode(200)
  async exportar(@CurrentUser() user: JwtPayload, @Body() dto: ExportarDto, @Res() res: Response) {
    const { ids, ...filtros } = dto;
    const zip = await this.service.exportarZip(user.organizationId, ids, filtros);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="documentos-fiscais-${new Date().toISOString().slice(0, 10)}.zip"`);
    res.send(zip);
  }

  @Post('remover')
  @HttpCode(200)
  @Requer('fiscal.excluir')
  remover(@CurrentUser() user: JwtPayload, @Body() dto: IdsDto) {
    return this.service.remover(user.organizationId, dto.ids);
  }

  @Get(':id')
  detalhe(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.detalhe(user.organizationId, id);
  }

  @Get(':id/arquivo')
  async arquivo(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Query('inline') inline: string, @Res() res: Response) {
    const d = await this.service.arquivo(user.organizationId, id);
    res.setHeader('Content-Type', d.mimeType);
    res.setHeader('Content-Disposition', `${inline === '1' ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(d.nomeArquivo)}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(Buffer.from(d.conteudo));
  }

  @Patch(':id/cliente')
  @Requer('fiscal.enviar')
  vincular(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: VincularDto) {
    return this.service.vincularCliente(user.organizationId, id, dto.clientId ?? null);
  }
}

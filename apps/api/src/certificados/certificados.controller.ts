import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissoesGuard, Requer } from '../auth/permissoes.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CertificadosService } from './certificados.service';

@UseGuards(JwtAuthGuard, PermissoesGuard)
@Requer('certificados')
@Controller('certificados')
export class CertificadosController {
  constructor(private readonly certificadosService: CertificadosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body('senha') senha: string,
    @Body('clientId') clientId?: string,
  ) {
    return this.certificadosService.upload(user.organizationId, file, senha, clientId);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query('clientId') clientId?: string) {
    return this.certificadosService.findAll(user.organizationId, clientId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.certificadosService.remove(user.organizationId, id);
  }
}

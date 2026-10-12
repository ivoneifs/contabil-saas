import { Module } from '@nestjs/common';
import { PlataformaService } from './plataforma.service';
import { PlataformaAdminController, PlataformaPublicaController } from './plataforma.controller';

@Module({
  providers: [PlataformaService],
  controllers: [PlataformaPublicaController, PlataformaAdminController],
})
export class PlataformaModule {}

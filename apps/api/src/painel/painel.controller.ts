import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PainelService } from './painel.service';

@UseGuards(JwtAuthGuard)
@Controller('painel')
export class PainelController {
  constructor(private readonly painelService: PainelService) {}

  @Get('resumo')
  resumo(@CurrentUser() user: JwtPayload) {
    return this.painelService.resumo(user.organizationId);
  }
}

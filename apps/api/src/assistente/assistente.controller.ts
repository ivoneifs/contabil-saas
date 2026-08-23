import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { AssistenteService } from './assistente.service';
import { ChatDto } from './dto/chat.dto';

@UseGuards(JwtAuthGuard)
@Controller('assistente')
export class AssistenteController {
  constructor(private readonly assistenteService: AssistenteService) {}

  @Post('chat')
  chat(@CurrentUser() user: JwtPayload, @Body() dto: ChatDto) {
    return this.assistenteService.chat(user.organizationId, dto);
  }
}

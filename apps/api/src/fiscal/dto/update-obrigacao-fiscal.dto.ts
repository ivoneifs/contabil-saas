import { IsEnum } from 'class-validator';
import { ObrigacaoFiscalStatus } from '@prisma/client';

export class UpdateObrigacaoFiscalDto {
  @IsEnum(ObrigacaoFiscalStatus)
  status: ObrigacaoFiscalStatus;
}

import { IsEnum, IsOptional } from 'class-validator';
import { LancamentoStatus } from '@prisma/client';

export class UpdateLancamentoDto {
  @IsOptional()
  @IsEnum(LancamentoStatus)
  status?: LancamentoStatus;

  @IsOptional()
  boletoUrl?: string;

  @IsOptional()
  asaasChargeId?: string;
}

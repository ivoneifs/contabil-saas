import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { LancamentoTipo } from '@prisma/client';

export class CreateLancamentoDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsEnum(LancamentoTipo)
  tipo: LancamentoTipo;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsNumber()
  @IsPositive()
  valor: number;

  @IsDateString()
  vencimento: string;
}

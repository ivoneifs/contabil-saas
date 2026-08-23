import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { NotaFiscalTipo } from '@prisma/client';

export class CreateNotaFiscalDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsEnum(NotaFiscalTipo)
  tipo: NotaFiscalTipo;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsNumber()
  @IsPositive()
  valorTotal: number;
}

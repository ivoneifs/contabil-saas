import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateObrigacaoFiscalDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  competencia: string;

  @IsDateString()
  prazo: string;
}

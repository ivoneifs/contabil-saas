import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCompromissoDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsOptional()
  descricao?: string;

  @IsDateString()
  inicio: string;

  @IsDateString()
  fim: string;
}

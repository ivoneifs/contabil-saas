import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateFuncionarioDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  cpf: string;

  @IsOptional()
  cargo?: string;

  @IsNumber()
  @IsPositive()
  salarioBase: number;

  @IsDateString()
  dataAdmissao: string;
}

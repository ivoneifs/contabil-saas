import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { VinculoTrabalho } from '@prisma/client';

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

  @IsOptional() @IsEnum(VinculoTrabalho) vinculo?: VinculoTrabalho;
  @IsOptional() @IsString() matricula?: string;
  @IsOptional() @IsString() pis?: string;
  @IsOptional() @IsString() cbo?: string;
  @IsOptional() @IsDateString() dataNascimento?: string;
  @IsOptional() @IsInt() @Min(0) @Max(20) dependentesIrrf?: number;
  @IsOptional() @IsInt() @Min(1) @Max(240) jornadaMensal?: number;
  @IsOptional() @IsBoolean() valeTransporte?: boolean;
  @IsOptional() @IsNumber() @Min(0) pensaoAlimenticia?: number;
  @IsOptional() @IsString() email?: string;
}

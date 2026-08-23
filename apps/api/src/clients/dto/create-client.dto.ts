import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RegimeTributario } from '@prisma/client';

export class CreateClientDto {
  @IsNotEmpty()
  razaoSocial: string;

  @IsOptional()
  nomeFantasia?: string;

  @IsNotEmpty()
  cnpjCpf: string;

  @IsOptional()
  @IsEnum(RegimeTributario)
  regimeTributario?: RegimeTributario;

  @IsString()
  @IsNotEmpty()
  uf: string;

  @IsOptional()
  municipio?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  telefone?: string;
}

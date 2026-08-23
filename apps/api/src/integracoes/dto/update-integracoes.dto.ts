import { IsOptional, IsString } from 'class-validator';

export class UpdateIntegracoesDto {
  @IsOptional()
  @IsString()
  focusNfeToken?: string;

  @IsOptional()
  @IsString()
  focusNfeBaseUrl?: string;

  @IsOptional()
  @IsString()
  asaasApiKey?: string;
}

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

  @IsOptional()
  @IsString()
  serproConsumerKey?: string;

  @IsOptional()
  @IsString()
  serproConsumerSecret?: string;

  @IsOptional()
  @IsString()
  nuvemFiscalClientId?: string;

  @IsOptional()
  @IsString()
  nuvemFiscalClientSecret?: string;
}

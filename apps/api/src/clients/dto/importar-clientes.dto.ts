import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, Length, MaxLength, ValidateNested } from 'class-validator';

class ItemImportacaoDto {
  @IsString() documento: string;
  @IsOptional() @IsString() @MaxLength(150) nome?: string;
  @IsOptional() @IsString() @Length(2, 2) uf?: string;
}

export class ImportarClientesDto {
  // Formato antigo: só CNPJs.
  @IsOptional() @IsArray() @IsString({ each: true }) cnpjs?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => ItemImportacaoDto) itens?: ItemImportacaoDto[];

  @IsOptional() @IsString() @Length(2, 2) ufPadrao?: string;

  // Contador a quem a carteira importada pertence.
  @IsOptional() @IsString() contadorId?: string;
}

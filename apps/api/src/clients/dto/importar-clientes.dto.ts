import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ImportarClientesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  cnpjs: string[];
}

import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsOptional, ValidateIf } from 'class-validator';
import { CreateFuncionarioDto } from './create-funcionario.dto';

export class UpdateFuncionarioDto extends PartialType(CreateFuncionarioDto) {
  @IsOptional()
  @ValidateIf((_, v) => v !== '')
  @IsDateString()
  dataDemissao?: string;
}

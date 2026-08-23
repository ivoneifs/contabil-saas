import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateFuncionarioDto } from './create-funcionario.dto';

export class UpdateFuncionarioDto extends PartialType(CreateFuncionarioDto) {
  @IsOptional()
  @IsDateString()
  dataDemissao?: string;
}

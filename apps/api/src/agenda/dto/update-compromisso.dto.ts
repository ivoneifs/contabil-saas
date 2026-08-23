import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CompromissoStatus } from '@prisma/client';
import { CreateCompromissoDto } from './create-compromisso.dto';

export class UpdateCompromissoDto extends PartialType(CreateCompromissoDto) {
  @IsOptional()
  @IsEnum(CompromissoStatus)
  status?: CompromissoStatus;
}

import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  organizationName: string;

  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}

import { IsEmail, IsNotEmpty, MinLength, MaxLength } from "class-validator";

export class SignupRequestDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MaxLength(30)
  username!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}



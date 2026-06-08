import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginUserDto {
  @IsEmail()
  mail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
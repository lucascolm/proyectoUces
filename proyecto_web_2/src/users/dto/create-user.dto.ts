import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";


export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  surname: string;

  @IsEmail()
  mail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/.../)
  password: string;
}
import { Exclude } from "class-transformer";

export class UserResponseDto {
  id: string;
  name: string;
  surname: string;
  mail: string;
  role: string;

  @Exclude()
  password: string;
}
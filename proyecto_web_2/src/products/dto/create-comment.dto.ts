// src/products/dto/create-comment.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  message: string;
}
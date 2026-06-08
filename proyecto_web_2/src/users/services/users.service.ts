import { ConflictException, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import type { IUsersRepository } from "../repositories/users.repository";
import { CreateUserDto } from "../dto/create-user.dto";
import { UserResponseDto } from "../dto/user-response.dto";
import { plainToClass } from "class-transformer";
import { User } from "../schemas/user.schema";

// src/users/services/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.create(createUserDto);
      return plainToClass(UserResponseDto, user.toObject());
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('Email already exists');
      }

      throw new InternalServerErrorException('Could not create user');
    }
  }

  async findByEmail(mail:string):Promise<User|null>{
    return this.usersRepository.findByEmail(mail)
  }
}
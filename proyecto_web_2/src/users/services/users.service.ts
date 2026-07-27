import { ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import type { IUsersRepository } from "../repositories/users.repository";
import { CreateUserDto } from "../dto/create-user.dto";
import { UserResponseDto } from "../dto/user-response.dto";
import { plainToClass } from "class-transformer";
import { User } from "../schemas/user.schema";
import { UserRole } from '../schemas/user.schema';

// src/users/services/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject('IUsersRepository') private readonly usersRepository: IUsersRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findByEmail(createUserDto.mail);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = await this.usersRepository.create(createUserDto);
    return plainToClass(UserResponseDto, user.toObject());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return plainToClass(UserResponseDto, user.toObject());
  }

  async findAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.findAll();
    return users.map((user) => plainToClass(UserResponseDto, user.toObject()));
  }

  async update(id: string, updateData: Partial<User>): Promise<UserResponseDto> {
    const user = await this.usersRepository.update(id, updateData);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return plainToClass(UserResponseDto, user.toObject());
  }

  async delete(id: string): Promise<boolean> {
    return this.usersRepository.delete(id);
  }

  async updateRole(userId: string, role: UserRole) {
  const user = await this.usersRepository.update(userId, { role });
  if (!user) throw new NotFoundException('User not found');
  return { message: `Role updated to ${role}` };
}
}
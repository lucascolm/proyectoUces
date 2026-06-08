import { Inject, Injectable } from "@nestjs/common";
import { CreateUserDto } from "../dto/create-user.dto";
import { User } from "../schemas/user.schema";
import { Model } from "mongoose"
import type { IUsersDao } from "../dao/users.moongoose.dao";

export interface IUsersRepository {
  create(userData: CreateUserDto): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
//   findById(id: string): Promise<User | null>;
//   findAll(): Promise<User[]>;
//   update(id: string, updateData: Partial<User>): Promise<User | null>;
//   delete(id: string): Promise<boolean>;
}

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    @Inject('IUsersDao') private readonly dao: IUsersDao,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.dao.findByEmail(email);
  }

async create(userData:CreateUserDto):Promise<User>{
    return this.dao.create(userData)
}
}
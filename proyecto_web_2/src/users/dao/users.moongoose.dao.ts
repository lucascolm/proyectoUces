import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "../dto/create-user.dto";
import { User } from "../schemas/user.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose"


export interface IUsersDao {
  create(userData: CreateUserDto): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
//   findById(id: string): Promise<User | null>;
//   findAll(): Promise<User[]>;
//   update(id: string, updateData: Partial<User>): Promise<User | null>;
//   delete(id: string): Promise<boolean>;
}

@Injectable()
export class UsersMongooseDao implements IUsersDao {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(userData: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
      return this.userModel.findOne({mail:email}).exec();
  }
}
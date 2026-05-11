import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create_user.dto';
import { InjectModel } from '@nestjs/mongoose/dist/common/mongoose.decorators';
import { User } from './dto/schemas/user.schema';
import { Model } from 'mongoose';
@Injectable()
export class UsersService {
    constructor(
         @InjectModel(User.name) private userModel: Model<User>,
    ){}


    validateMailUniqueness(mail :string): boolean{
        //buscar en BD si ya existe el mail

        return true;
    }

     async create(createUserDto: CreateUserDto) {

        this.validateMailUniqueness(createUserDto.mail)
        try {
            const createdUser = new this.userModel(createUserDto);
            console.log(createdUser)
            return createdUser.save();

        }catch (error){
            console.log(error)

        }

    }

    async findAllUsers() {
        return this.userModel.find().exec();
    }

        
    
}

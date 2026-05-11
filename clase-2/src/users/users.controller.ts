import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create_user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ){}


    @Post("/create")
    create(@Body() createUser: CreateUserDto){
        

        return this.usersService.create(createUser)
    }


     @Get()
        getUsers(){
        const users = this.usersService.findAllUsers();

        return users
    }
}

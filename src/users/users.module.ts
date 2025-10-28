import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User])], // <-- provides Repository<User> here
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],                      // <-- so AuthModule can inject it
})
export class UsersModule { }

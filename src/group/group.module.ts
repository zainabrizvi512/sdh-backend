import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './group.entity';
import { User } from '../users/user.entity';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Group, User])],
    controllers: [GroupController],
    providers: [GroupService],
    exports: [GroupService],
})
export class GroupModule { }

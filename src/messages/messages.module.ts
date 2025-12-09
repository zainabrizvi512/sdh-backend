import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './message.entity';
import { MessageAttachment } from './messageAttachment.entity';
import { MessageRead } from './messageRead.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { User } from '../users/user.entity';
import { Group } from 'src/group/group.entity';
import { UploadsController } from './uploads.controller';
import { MessagesRestController } from './messages.rest.controller';
import { StorageModule } from 'src/storage/storage.module';

@Module({
    imports: [TypeOrmModule.forFeature([Message, MessageAttachment, MessageRead, Group, User]), StorageModule],
    controllers: [MessagesController, UploadsController, MessagesRestController],
    providers: [MessagesService, MessagesGateway],
    exports: [MessagesService, MessagesGateway],
})
export class MessagesModule { }

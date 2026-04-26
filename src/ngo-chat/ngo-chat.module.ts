import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NgoMessage } from './ngo-message.entity';
import { NgoChatService } from './ngo-chat.service';
import { NgoChatGateway } from './ngo-chat.gateway';
import { User } from 'src/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NgoMessage, User])],
  providers: [NgoChatService, NgoChatGateway],
  exports: [NgoChatService],
})
export class NgoChatModule {}
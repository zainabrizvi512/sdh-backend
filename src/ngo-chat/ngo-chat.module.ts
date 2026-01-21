import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NgoMessage } from './ngo-message.entity';
import { NgoChatService } from './ngo-chat.service';
import { NgoChatGateway } from './ngo-chat.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([NgoMessage])],
  providers: [NgoChatService, NgoChatGateway],
})
export class NgoChatModule {}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NgoMessage } from './ngo-message.entity';
import { User } from '../users/user.entity';
import { NGO } from '../ngo/ngo.entity';

@Injectable()
export class NgoChatService {
  constructor(
    @InjectRepository(NgoMessage) private msgRepo: Repository<NgoMessage>,
  ) {}

  async saveMessage(userId: string, ngoId: string, text: string) {
    // We assume validation happened in the Gateway
    const msg = this.msgRepo.create({
      text,
      sender: { id: userId } as User,
      ngo: { id: ngoId } as NGO,
    });
    return await this.msgRepo.save(msg);
  }

  async getRecentMessages(ngoId: string) {
    return this.msgRepo.find({
      where: { ngo: { id: ngoId } },
      order: { createdAt: 'DESC' },
      take: 50,
      relations: ['sender'],
    });
  }
}
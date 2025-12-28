// src/modules/aid-network/aid-network.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group, GroupType } from 'src/group/group.entity';
import { User } from '../users/user.entity';
import { Message, MessageType } from 'src/messages/message.entity';

@Injectable() 
export class AidNetworkService {
    constructor(
        @InjectRepository(Message) private messageRepo: Repository<Message>,
        @InjectRepository(Group) private groupRepo: Repository<Group>,
        @InjectRepository(User) private userRepo: Repository<User>,
    ) {}

    async triggerEmergencySOS(userId: string, lat: number, lng: number) {
        // 1. Find the user
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // 2. Create or find an Emergency Group for this user/area
        // In an emergency, we often create a transient group or alert a city-wide group
        const emergencyGroup = this.groupRepo.create({
            name: `SOS: ${user.username}`,
            type: GroupType.EMERGENCY,
            owner: user, // TypeORM usually expects the relation object or 'ownerId' if defined as a column
        });
        const savedGroup = await this.groupRepo.save(emergencyGroup);

        // 3. Create the SOS Message using your exact entity structure
        const sosMessage = this.messageRepo.create({
            group: savedGroup,
            sender: user,
            type: MessageType.LOCATION,
            kind: "location",
            text: `EMERGENCY ALERT: ${user.username} needs assistance!`,
            location_lat: lat,
            location_lng: lng,
            location_accuracy: 10, // Default or passed from device
        });

        return await this.messageRepo.save(sosMessage);
    }

    async getVolunteerStock(city: string) {
        // This maps to your 'resource_links' or a similar table from the ERD
        // Returning mock data based on your UI image (Blankets, First Aid Kits, etc.)
        return [
            { item: 'Blankets', available: 240 },
            { item: 'First Aid Kits', available: 58 },
            { item: 'Bottled Water', available: 375 },
        ];
    }
}
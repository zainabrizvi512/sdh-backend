import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Group } from './group.entity';
import { User } from '../users/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { RemoveMembersDto } from './dto/remove-members.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { LeaveGroupDto } from './dto/leave-group.dto';
import { GroupMember } from './types/group-member.type';

@Injectable()
export class GroupService {
    constructor(
        @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
        @InjectRepository(User) private readonly usersRepo: Repository<User>,
    ) { }

    private async getUserOrThrow(userId: string): Promise<User> {
        const u = await this.usersRepo.findOne({ where: { id: userId } });
        if (!u) throw new NotFoundException('User not found');
        return u;
    }

    async create(ownerId: string, dto: CreateGroupDto): Promise<Group> {
        const owner = await this.getUserOrThrow(ownerId);

        let members: User[] = [];
        if (dto.memberIds?.length) {
            members = await this.usersRepo.find({ where: { id: In(dto.memberIds) } });
            if (members.length !== dto.memberIds.length) {
                throw new BadRequestException('One or more memberIds are invalid');
            }
            // ensure owner is also a member (commonly expected)
            if (!members.find(m => m.id === owner.id)) {
                members.push(owner);
            }
        } else {
            members = [owner];
        }

        const group = this.groupsRepo.create({
            name: dto.name,
            picture: dto.picture,
            type: dto.type,
            owner,
            members,
        });

        return this.groupsRepo.save(group);
    }

    async addMembers(currentUserId: string, groupId: string, dto: AddMembersDto): Promise<Group> {
        const group = await this.groupsRepo.findOne({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group not found');

        // simple permission: only owner can modify
        if (group.owner.id !== currentUserId) {
            throw new ForbiddenException('Only the group owner can add members');
        }

        const toAdd = await this.usersRepo.find({ where: { id: In(dto.memberIds) } });
        if (toAdd.length !== dto.memberIds.length) {
            throw new BadRequestException('One or more memberIds are invalid');
        }

        const existingIds = new Set(group.members.map(m => m.id));
        const newMembers = [...group.members, ...toAdd.filter(u => !existingIds.has(u.id))];

        group.members = newMembers;
        return this.groupsRepo.save(group);
    }

    async removeMembers(currentUserId: string, groupId: string, dto: RemoveMembersDto): Promise<Group> {
        const group = await this.groupsRepo.findOne({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group not found');

        if (group.owner.id !== currentUserId) {
            throw new ForbiddenException('Only the group owner can remove members');
        }

        const ownerId = group.owner.id;
        const targetSet = new Set(dto.memberIds);

        // Never remove owner
        if (targetSet.has(ownerId)) {
            throw new BadRequestException('Owner cannot be removed from the group');
        }

        group.members = group.members.filter(m => !targetSet.has(m.id));
        return this.groupsRepo.save(group);
    }

    async findOneForUser(currentUserId: string, groupId: string): Promise<Group> {
        const group = await this.groupsRepo.findOne({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group not found');

        const isMember = group.members.some(m => m.id === currentUserId);
        if (!isMember) throw new ForbiddenException('You are not a member of this group');

        return group;
    }

    async listMyGroups(currentUserId: string): Promise<Group[]> {
        // "eager: true" on relations means members and owner are included
        const groups = await this.groupsRepo
            .createQueryBuilder('g')
            .leftJoinAndSelect('g.members', 'm')
            .leftJoinAndSelect('g.owner', 'o')
            .where('m.id = :uid OR o.id = :uid', { uid: currentUserId })
            .orderBy('g.updatedAt', 'DESC')
            .getMany();

        return groups;
    }

    async updateGroup(currentUserId: string, groupId: string, dto: UpdateGroupDto): Promise<Group> {
        const group = await this.groupsRepo.findOne({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group not found');

        if (group.owner.id !== currentUserId) {
            throw new ForbiddenException('Only the group owner can update the group');
        }

        if (typeof dto.name !== 'undefined') group.name = dto.name;
        if (typeof dto.picture !== 'undefined') group.picture = dto.picture;
        if (typeof dto.type !== 'undefined') group.type = dto.type;

        return this.groupsRepo.save(group);
    }

    async deleteGroup(currentUserId: string, groupId: string): Promise<void> {
        const group = await this.groupsRepo.findOne({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group not found');

        if (group.owner.id !== currentUserId) {
            throw new ForbiddenException('Only the group owner can delete the group');
        }

        await this.groupsRepo.delete(group.id);
    }

    async leaveGroup(currentUserId: string, groupId: string, dto: LeaveGroupDto): Promise<{ deleted?: true; group?: any }> {
        const group = await this.groupsRepo.findOne({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group not found');

        const isMember = group.members.some(m => m.id === currentUserId);
        if (!isMember && group.owner.id !== currentUserId) {
            throw new ForbiddenException('You are not a member of this group');
        }

        const isOwner = group.owner.id === currentUserId;

        // If a regular member leaves
        if (!isOwner) {
            group.members = group.members.filter(m => m.id !== currentUserId);
            await this.groupsRepo.save(group);
            return { group };
        }

        // Owner is leaving
        const nonOwnerMembers = group.members.filter(m => m.id !== currentUserId);

        // Case 1: owner is the only member => delete the group
        if (nonOwnerMembers.length === 0) {
            await this.groupsRepo.delete(group.id);
            return { deleted: true };
        }

        // Case 2: owner must transfer ownership to an existing member
        if (!dto?.newOwnerId) {
            throw new BadRequestException('Owner must provide newOwnerId to transfer ownership before leaving');
        }

        const newOwner = nonOwnerMembers.find(m => m.id === dto.newOwnerId);
        if (!newOwner) {
            throw new BadRequestException('newOwnerId must be an existing member');
        }

        // transfer ownership and remove old owner from members
        group.owner = newOwner;
        group.members = group.members.filter(m => m.id !== currentUserId); // owner leaves
        const saved = await this.groupsRepo.save(group);
        return { group: saved };
    }

    async listMembers(currentUserId: string, groupId: string): Promise<GroupMember[]> {
        const group = await this.groupsRepo.findOne({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group not found');

        // Must be owner or member to view the list
        const isMember =
            group.owner.id === currentUserId ||
            group.members.some((m) => m.id === currentUserId);

        if (!isMember) throw new ForbiddenException('You are not a member of this group');

        // Build a unified list including owner
        const owner: GroupMember = {
            id: group.owner.id,
            username: group.owner.username ?? null,
            picture: group.owner.picture ?? null,
            email: group.owner.email,
            isOwner: true,
        };

        const memberSet = new Map<string, GroupMember>();
        memberSet.set(owner.id, owner);

        for (const m of group.members) {
            memberSet.set(m.id, {
                id: m.id,
                username: m.username ?? null,
                picture: m.picture ?? null,
                email: m.email,
                isOwner: m.id === group.owner.id, // should be false if owner isn’t duplicated
            });
        }

        return Array.from(memberSet.values());
    }
}

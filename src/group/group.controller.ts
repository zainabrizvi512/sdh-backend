import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { RemoveMembersDto } from './dto/remove-members.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { LeaveGroupDto } from './dto/leave-group.dto';

@Controller('groups')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class GroupController {
    constructor(private readonly groupsService: GroupService) { }

    // POST /groups
    @Post()
    async create(@Req() req: any, @Body() dto: CreateGroupDto) {
        const currentUserId = req.user.id; // set by your auth layer
        return this.groupsService.create(currentUserId, dto);
    }

    // GET /groups (list groups current user belongs to or owns)
    @Get()
    async myGroups(@Req() req: any) {
        const currentUserId = req.user.id;
        return this.groupsService.listMyGroups(currentUserId);
    }

    // GET /groups/:id
    @Get(':id')
    async getOne(@Req() req: any, @Param('id') id: string) {
        const currentUserId = req.user.id;
        return this.groupsService.findOneForUser(currentUserId, id);
    }

    // PATCH /groups/:id
    @Patch(':id')
    async updateGroup(
        @Req() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateGroupDto,
    ) {
        const currentUserId = req.user.id;
        return this.groupsService.updateGroup(currentUserId, id, dto);
    }

    // POST /groups/:id/members
    @Post(':id/members')
    async addMembers(
        @Req() req: any,
        @Param('id') groupId: string,
        @Body() dto: AddMembersDto,
    ) {
        const currentUserId = req.user.id;
        return this.groupsService.addMembers(currentUserId, groupId, dto);
    }

    // DELETE /groups/:id/members
    @Delete(':id/members')
    async removeMembers(
        @Req() req: any,
        @Param('id') groupId: string,
        @Body() dto: RemoveMembersDto,
    ) {
        const currentUserId = req.user.id;
        return this.groupsService.removeMembers(currentUserId, groupId, dto);
    }

    // DELETE /groups/:id
    @Delete(':id')
    async deleteGroup(@Req() req: any, @Param('id') id: string) {
        const currentUserId = req.user.id;
        await this.groupsService.deleteGroup(currentUserId, id);
        return { success: true };
    }

    // POST /groups/:id/leave
    @Post(':id/leave')
    async leave(
        @Req() req: any,
        @Param('id') groupId: string,
        @Body() dto: LeaveGroupDto,
    ) {
        const currentUserId = req.user.id;
        return this.groupsService.leaveGroup(currentUserId, groupId, dto);
    }

    @Get(':id/members')
    async listMembers(@Req() req: any, @Param('id') groupId: string) {
        const currentUserId = req.user.id;
        return this.groupsService.listMembers(currentUserId, groupId);
    }
}

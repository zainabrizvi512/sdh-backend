import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { RemoveMembersDto } from './dto/remove-members.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { LeaveGroupDto } from './dto/leave-group.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from 'src/storage/storage.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupController {
    constructor(private readonly groupsService: GroupService, private readonly storage: StorageService) { }

    // Content-Type: multipart/form-data
    @Post()
    @UseInterceptors(FileInterceptor('picture', {
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }))
    async create(
        @Req() req: any,
        @Body() body: any, // raw, because form-data values are strings
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const currentUserId = req.user.sub;

        // Convert the incoming form-data into CreateGroupDto
        const dto: CreateGroupDto = {
            name: body.name,
            type: body.type, // "family" | "friends" | ...
            // memberIds may be sent as JSON string or comma-separated
            memberIds: this.parseMemberIds(body.memberIds),
        };

        // If there is a file, upload it to GCS and set dto.picture to the uploaded URL
        if (file) {
            // Basic mime allowlist (adjust as needed)
            if (!/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) {
                throw new Error('Only PNG/JPG/WEBP images are allowed');
            }

            const destPath = `group-pictures/${Date.now()}-${this.safeName(file.originalname)}`;
            const pictureUrl = await this.storage.uploadBuffer({
                buffer: file.buffer,
                contentType: file.mimetype,
                destPath,
                makePublic: true, // set to false if your bucket is private
            });
            dto.picture = pictureUrl;
        }

        return this.groupsService.create(currentUserId, dto);
    }

    // GET /groups (list groups current user belongs to or owns)
    @Get()
    async myGroups(@Req() req: any) {
        const currentUserId = req.user.sub;
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
        const currentUserId = req.user.sub;
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
        const currentUserId = req.user.sub;
        return this.groupsService.listMembers(currentUserId, groupId);
    }

    parseMemberIds(input?: string): string[] | undefined {
        if (!input) return undefined;
        // Try JSON first (e.g., '["uuid1","uuid2"]')
        try {
            const arr = JSON.parse(input);
            if (Array.isArray(arr)) return arr;
        } catch { }
        // Fallback comma-separated string
        return input.split(',').map(s => s.trim()).filter(Boolean);
    }

    safeName(name: string) {
        return name.replace(/[^\w.\-]+/g, '_');
    }
}

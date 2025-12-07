import { BadRequestException, Body, Controller, Get, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { StorageService } from 'src/storage/storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import path from 'path';



@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService, private readonly storageService: StorageService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    async me(@Req() req: any) {
        const claims = req.user;
        const sub = claims?.sub;
        if (!sub) throw new BadRequestException('Missing sub in token');

        // Build initial DTO from token
        let dto: AuthUserDto = {
            sub,
            email: claims.email ?? null,
            picture: claims.picture ?? null,
            name: claims.name ?? null,
            nickname: claims.nickname ?? null,
            connectionType:
                claims.connectionType ??
                claims.raw?.identities?.[0]?.provider ??
                claims.raw?.identities?.[0]?.connection ??
                'unknown',
        };

        // If important fields are missing, enrich from Auth0 Management API
        const needsEnrich =
            !dto.email || !dto.picture || !dto.nickname || !dto.connectionType || dto.connectionType === 'unknown';

        if (needsEnrich) {
            const enriched = await this.usersService.getUserBySub(sub);
            dto = {
                sub: enriched.sub ?? dto.sub,
                email: enriched.email ?? dto.email,
                picture: enriched.picture ?? dto.picture,
                name: enriched.name ?? dto.name,
                nickname: dto.nickname ?? (enriched.name ?? null), // keep nickname if present; else fall back
                connectionType: enriched.connectionType ?? dto.connectionType ?? 'unknown',
            };
        }

        // Upsert and return the DB user object
        const user = await this.usersService.upsertFromAuthProfile(dto);
        return user;
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('me/location')
    async updateMyLocation(
        @Req() req: any,
        @Body()
        dto: UpdateLocationDto,
    ) {
        const sub = req.user?.sub;
        if (!sub) throw new BadRequestException('Missing sub in token');

        const updated = await this.usersService.updateLocation(sub, dto);
        return updated;
    }

    // GET /users?q=ali&limit=25&offset=0&excludeGroupId=...&notInGroup=true
    @UseGuards(AuthGuard('jwt'))
    @Get()
    async listAll(@Req() req: any, @Query() query: ListUsersQueryDto) {
        const requesterId = req.user.sub;
        return this.usersService.listAllUsers(requesterId, query);
    }

    // ADD inside @Controller('users') class
    @UseGuards(AuthGuard('jwt'))
    @Patch('profile')
    async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(req.user?.sub, dto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('me/picture')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: multer.memoryStorage(),
            limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype?.startsWith('image/')) {
                    return cb(new BadRequestException('Only image files are allowed'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadMyPicture(
        @Req() req: any,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const sub = req.user?.sub;
        if (!sub) throw new BadRequestException('Missing sub in token');
        if (!file) throw new BadRequestException('No file uploaded');

        // Choose an extension based on mimetype (falls back to original)
        const extFromMime = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'image/heic': '.heic',
            'image/heif': '.heif',
            'image/gif': '.gif',
            'image/avif': '.avif',
            'image/svg+xml': '.svg',
        } as const;
        const ext =
            (extFromMime as any)[file.mimetype] ||
            path.extname(file.originalname || '') ||
            '.jpg';

        const destPath = `users/${sub}/pfp_${Date.now()}${ext}`;

        const imageUrl = await this.storageService.uploadBuffer({
            buffer: file.buffer,
            contentType: file.mimetype,
            destPath,
            // makePublic controlled inside StorageService
        });

        return { imageUrl };
    }

}

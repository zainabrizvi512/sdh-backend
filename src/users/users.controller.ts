import { BadRequestException, Body, Controller, Get, Patch, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

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
}

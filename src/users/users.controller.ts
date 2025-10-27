import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    async me(@Req() req: any) {
        const claims = req.user;         // from JwtStrategy.validate
        const sub = claims?.sub;

        // If your token already includes useful claims (email/picture), prefer them:
        const quick = {
            sub,
            email: claims.email ?? null,
            picture: claims.picture ?? null,
            name: claims.name ?? claims.nickname ?? null,
        };

        // If something is missing (or you need connectionType), fetch from Management API:
        if (!quick.email || !quick.picture) {
            const enriched = await this.usersService.getUserBySub(sub);
            return { ...enriched, tokenClaims: quick }; // optional merge
        }

        // Optionally derive connectionType from a custom claim (see “Bonus”)
        return quick;
    }
}

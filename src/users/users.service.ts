import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { User } from './user.entity';
import { AuthUserDto } from './dto/auth-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

type MgmtToken = { token: string; exp: number };

@Injectable()
export class UsersService {
    private mgmtToken: MgmtToken | null = null;

    constructor(@InjectRepository(User) private repo: Repository<User>) { }

    private async getManagementToken(): Promise<string> {
        const now = Math.floor(Date.now() / 1000);
        if (this.mgmtToken && this.mgmtToken.exp - 30 > now) return this.mgmtToken.token;

        try {
            const url = `https://${process.env.AUTH0_DOMAIN}/oauth/token`;
            const { data } = await axios.post(url, {
                grant_type: 'client_credentials',
                client_id: process.env.AUTH0_MGMT_CLIENT_ID,
                client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
                audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
            });

            this.mgmtToken = { token: data.access_token, exp: now + (data.expires_in ?? 3600) };
            return this.mgmtToken.token;
        } catch (e) {
            throw new InternalServerErrorException('Auth0 management token error', e as any);
        }
    }

    // Pulls profile from Auth0 Management API
    async getUserBySub(sub: string) {
        const token = await this.getManagementToken();
        const url = `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(sub)}`;
        const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

        const connectionType =
            Array.isArray(data.identities) && data.identities[0]
                ? data.identities[0].connection ?? data.identities[0].provider
                : null;

        return {
            sub: data.user_id,
            email: data.email ?? null,
            name: data.name ?? null,
            picture: data.picture ?? null,
            connectionType,
            raw: data,
        };
    }

    // INSERT if not exists; UPDATE if exists; always return the saved entity
    async upsertFromAuthProfile(input: AuthUserDto): Promise<User> {
        const existing = await this.repo.findOne({ where: { sub: input.sub } });

        // Derive a sensible username if nickname is missing
        const derivedUsername =
            input.nickname ??
            (input.email ? input.email.split('@')[0] : undefined) ??
            (input.name ?? undefined);

        if (existing) {
            existing.email = input.email ?? existing.email;
            existing.picture = input.picture ?? existing.picture;
            existing.username = derivedUsername ?? existing.username;
            existing.connectionType = input.connectionType ?? existing.connectionType ?? 'unknown';
            return this.repo.save(existing);
        }

        const created = this.repo.create({
            sub: input.sub,
            email: input.email ?? '',
            picture: input.picture ?? undefined,
            username: derivedUsername,
            connectionType: input.connectionType ?? 'unknown',
        });

        return this.repo.save(created);
    }

    async findBySub(sub: string) {
        return this.repo.findOne({ where: { sub } });
    }
}

import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { User } from './user.entity';
import { AuthUserDto } from './dto/auth-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UserSummary } from './types/user-summary.types';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { Group } from 'src/group/group.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

    async findUsersWithinMeters(
        ds: DataSource,
        centerLat: number,
        centerLon: number,
        radiusMeters: number,
    ) {
        return ds.query(
            `
                SELECT u.*
                FROM users u
                WHERE u.latitude IS NOT NULL AND u.longitude IS NOT NULL
                AND earth_box(ll_to_earth($1, $2), $3) @> ll_to_earth(u.latitude, u.longitude)
                AND earth_distance(ll_to_earth($1, $2), ll_to_earth(u.latitude, u.longitude)) <= $3
                ORDER BY earth_distance(ll_to_earth($1, $2), ll_to_earth(u.latitude, u.longitude)) ASC
                `
            ,
            [centerLat, centerLon, radiusMeters],
        );
    }

    async updateLocation(sub: string, dto: UpdateLocationDto): Promise<User> {
        const user = await this.repo.findOne({ where: { sub } });
        if (!user) throw new NotFoundException('User not found');

        const round = (n: number) => Math.round(n * 1e7) / 1e7;

        user.latitude = round(dto.latitude);
        user.longitude = round(dto.longitude);
        if (typeof dto.city === 'string') user.city = dto.city;

        if ('location' in user) {
            // string format "(lon,lat)" is accepted by Postgres
            (user as any).location = `(${user.longitude},${user.latitude})`;
        }

        return this.repo.save(user);
    }

    async listAllUsers(
        requesterId: string,
        query: ListUsersQueryDto
    ): Promise<{ items: UserSummary[]; total: number; nextOffset: number | null }> {
        const { q, offset = 0, limit = 25, excludeGroupId, notInGroup = "false", excludeSelf = "true" } = query;

        const qb = this.repo
            .createQueryBuilder("u")
            .select(["u.id", "u.username", "u.email", "u.picture"]);

        // search by username/email (case-insensitive)
        if (q?.trim()) {
            qb.andWhere("(LOWER(u.username) LIKE :q OR LOWER(u.email) LIKE :q)", {
                q: `%${q.trim().toLowerCase()}%`,
            });
        }

        // exclude requester
        if (excludeSelf === "true") {
            qb.andWhere("u.sub <> :requesterId", { requesterId });
        }

        // exclude users already in a given group (owner or members)
        if (excludeGroupId && notInGroup === "true") {
            // Join against group owner + members relation
            // Assuming Group has owner: User and members: User[]
            qb.andWhere((qb2) => {
                const sub = qb2.subQuery()
                    .select("g_owner.id", "uid")
                    .from(Group, "g")
                    .leftJoin("g.owner", "g_owner")
                    .where("g.id = :excludeGroupId", { excludeGroupId })
                    .getQuery();

                const sub2 = qb2.subQuery()
                    .select("gm.id", "uid")
                    .from(Group, "g2")
                    .leftJoin("g2.members", "gm")
                    .where("g2.id = :excludeGroupId", { excludeGroupId })
                    .getQuery();

                // exclude if id is in owner OR in members
                return `u.id NOT IN (${sub}) AND u.id NOT IN (${sub2})`;
            });
        }

        // total count (for pagination UI)
        const total = await qb.getCount();

        // page
        qb.orderBy("LOWER(u.username)", "ASC", "NULLS LAST")
            .addOrderBy("LOWER(u.email)", "ASC")
            .offset(offset)
            .limit(limit);

        const rows = await qb.getRawAndEntities();
        const items: UserSummary[] = rows.entities.map((u) => ({
            id: u.id,
            username: u.username ?? null,
            email: u.email,
            picture: u.picture ?? null,
        }));

        const nextOffset = offset + limit < total ? offset + limit : null;

        return { items, total, nextOffset };
    }

    // ADD inside UsersService class
async updateProfile(userId: string, dto: UpdateProfileDto) {
  const user = await this.repo.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  if (dto.dob) dto.dob = new Date(dto.dob).toISOString().slice(0, 10);

  Object.assign(user, dto);
  return this.repo.save(user);
}
}

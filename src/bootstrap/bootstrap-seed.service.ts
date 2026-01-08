import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/user.entity';
import { Group, GroupType } from '../group/group.entity';

@Injectable()
export class BootstrapSeedService implements OnApplicationBootstrap {
    private readonly logger = new Logger(BootstrapSeedService.name);

    constructor(
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,

        @InjectRepository(Group)
        private readonly groupsRepo: Repository<Group>,
    ) { }

    async onApplicationBootstrap() {
        // Prevent crashes from killing app start; log instead
        try {
            await this.ensureSystemUserAndGlobalGroup();
        } catch (err: any) {
            this.logger.error(`Bootstrap seed failed: ${err?.message ?? err}`, err?.stack);
        }
    }

    private async ensureSystemUserAndGlobalGroup() {
        // ✅ Choose stable identifiers
        const SYSTEM_SUB = 'sdh-system';           // safest if your User has `sub`
        const SYSTEM_EMAIL = 'system@sdh.local';   // fallback if you prefer email uniqueness
        const SYSTEM_NAME = 'SDH System';

        const GLOBAL_GROUP_SLUG = 'global';
        const GLOBAL_GROUP_NAME = 'SDH Global';
        const GLOBAL_GROUP_TYPE = GroupType.EMERGENCY;

        // ---------------------------
        // 1) Ensure System User
        // ---------------------------
        // Prefer sub if it exists in your User schema; otherwise use email.
        // If your User entity doesn't have `sub`, switch the where clause to { email: SYSTEM_EMAIL }.
        let systemUser: User | null = null;

        systemUser = await this.usersRepo.findOne({
            where: { sub: SYSTEM_SUB },
        });

        if (!systemUser) {
            systemUser = this.usersRepo.create({
                sub: SYSTEM_SUB,
                email: SYSTEM_EMAIL,
                name: SYSTEM_NAME,
                username: 'sdh-system',
            });

            systemUser = await this.usersRepo.save(systemUser);
            this.logger.log(`✅ Created System User (id=${systemUser.id})`);
        } else {
            this.logger.log(`ℹ️ System User exists (id=${systemUser.id})`);
        }

        // ---------------------------
        // 2) Ensure Global Group
        // ---------------------------
        let globalGroup: Group | null = null;
        globalGroup = await this.groupsRepo.findOne({
            where: { slug: GLOBAL_GROUP_SLUG } as any,
        });

        if (!globalGroup) {
            globalGroup = this.groupsRepo.create({
                slug: GLOBAL_GROUP_SLUG,
                name: GLOBAL_GROUP_NAME,
                type: GLOBAL_GROUP_TYPE,
                owner: systemUser, // must be User, not null
                members: [],
            });

            globalGroup = await this.groupsRepo.save(globalGroup);

            this.logger.log(
                `✅ Created Global Group (id=${globalGroup.id}, slug=${globalGroup.slug})`,
            );
        } else {
            // Optional: enforce correct type/owner if it already exists but wrong
            let changed = false;

            if (globalGroup.type !== GLOBAL_GROUP_TYPE) {
                globalGroup.type = GLOBAL_GROUP_TYPE;
                changed = true;
            }

            if (!globalGroup.owner) {
                globalGroup.owner = systemUser;
                changed = true;
            }

            if (changed) {
                await this.groupsRepo.save(globalGroup);
                this.logger.log(`✅ Updated Global Group to expected settings (id=${globalGroup.id})`);
            } else {
                this.logger.log(`ℹ️ Global Group exists (id=${globalGroup.id})`);
            }
        }
    }
}

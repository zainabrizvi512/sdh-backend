import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BootstrapSeedService } from './bootstrap-seed.service';
import { User } from '../users/user.entity';
import { Group } from '../group/group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Group])],
  providers: [BootstrapSeedService],
})
export class BootstrapModule {}

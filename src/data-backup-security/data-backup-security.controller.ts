import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AccessControlRole } from './access-control-policy.entity';
import { DataBackupSecurityService } from './data-backup-security.service';
import { RestoreSnapshotDto, RestoreTestDto } from './dto/restore.dto';
import { SyncPushDto } from './dto/sync-push.dto';
import { ToggleEncryptedStorageDto } from './dto/toggle-encrypted-storage.dto';
import { ToggleSyncDto } from './dto/toggle-sync.dto';
import { UpdateAccessControlDto } from './dto/update-access-control.dto';

@UseGuards(JwtAuthGuard)
@Controller('data-security')
export class DataBackupSecurityController {
  constructor(private readonly dataSecurityService: DataBackupSecurityService) { }

  @Get('settings')
  getSettings(@Req() req: any) {
    return this.dataSecurityService.getSettings(req.user?.sub);
  }

  @Patch('settings/encrypted-storage')
  toggleEncryptedStorage(@Req() req: any, @Body() dto: ToggleEncryptedStorageDto) {
    return this.dataSecurityService.toggleEncryptedStorage(req.user?.sub, dto);
  }

  @Get('access-control')
  getAccessControl() {
    return this.dataSecurityService.getAccessControl();
  }

  @Patch('access-control/:role')
  updateAccessControl(@Param('role') role: AccessControlRole, @Body() dto: UpdateAccessControlDto) {
    return this.dataSecurityService.updateAccessControl(role, dto);
  }

  @Get('sync/status')
  getSyncStatus(@Req() req: any) {
    return this.dataSecurityService.getSyncStatus(req.user?.sub);
  }

  @Patch('sync/toggle')
  toggleSync(@Req() req: any, @Body() dto: ToggleSyncDto) {
    return this.dataSecurityService.toggleSync(req.user?.sub, dto);
  }

  @Post('sync/push')
  pushSync(@Req() req: any, @Body() dto: SyncPushDto) {
    return this.dataSecurityService.pushSync(req.user?.sub, dto);
  }

  @Get('sync/pull')
  pullSync(@Req() req: any, @Query('since') since?: string) {
    return this.dataSecurityService.pullSync(req.user?.sub, since);
  }

  @Get('recovery/snapshots')
  listSnapshots(@Req() req: any) {
    return this.dataSecurityService.listSnapshots(req.user?.sub);
  }

  @Get('recovery/restore-test/latest')
  getLastRestoreTest(@Req() req: any) {
    return this.dataSecurityService.getLastRestoreTest(req.user?.sub);
  }

  @Post('recovery/restore-test')
  runRestoreTest(@Req() req: any, @Body() dto: RestoreTestDto) {
    return this.dataSecurityService.runRestoreTest(req.user?.sub, dto);
  }

  @Post('recovery/restore')
  restoreSnapshot(@Req() req: any, @Body() dto: RestoreSnapshotDto) {
    return this.dataSecurityService.restoreSnapshot(req.user?.sub, dto);
  }
}

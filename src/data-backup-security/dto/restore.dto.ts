import { SnapshotType } from '../backup-snapshot.entity';

export class RestoreTestDto {
  snapshotId: string;
  notes?: string;
}

export class RestoreSnapshotDto {
  snapshotId: string;
}

export { SnapshotType };

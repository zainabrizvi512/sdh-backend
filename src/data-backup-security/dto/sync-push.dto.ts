export class SyncPushDto {
  entityType: string;
  entityId?: string;
  payload: Record<string, any>;
  version?: number;
}

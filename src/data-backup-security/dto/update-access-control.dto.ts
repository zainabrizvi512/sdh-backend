import { AccessControlRole } from '../access-control-policy.entity';

export class UpdateAccessControlDto {
  permissions: Record<string, boolean>;
  description?: string;
}

export { AccessControlRole };

import { DevicePlatform } from '../push-token.entity';

export class RegisterTokenDto {
    token: string;
    platform: DevicePlatform;
}

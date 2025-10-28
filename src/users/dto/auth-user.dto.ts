export class AuthUserDto {
    sub: string;
    email: string | null;
    picture?: string | null;
    name?: string | null;
    nickname?: string | null;
    connectionType: string;
}

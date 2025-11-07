// src/users/dto/list-users.query.dto.ts
export class ListUsersQueryDto {
    q?: string; // search by username/email (case-insensitive)
    offset?: number = 0;
    limit?: number = 25;
    excludeGroupId?: string; // when provided + notInGroup=true, filter out users already in that group
    notInGroup?: string = "false"; // "true" to exclude members of excludeGroupId
    excludeSelf?: string = "true"; // "true" to omit current requester
}

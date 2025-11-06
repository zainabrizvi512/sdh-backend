import { GroupType } from '../group.entity';

export class CreateGroupDto {
    name: string;
    picture?: string;
    type?: GroupType;
    memberIds?: string[];
}

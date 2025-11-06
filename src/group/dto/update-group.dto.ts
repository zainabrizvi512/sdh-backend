import { GroupType } from '../group.entity';

export class UpdateGroupDto {
    name?: string;
    picture?: string;
    type?: GroupType;
}

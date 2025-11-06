export type GroupMember = {
    id: string;
    username?: string | null;
    picture?: string | null;
    email: string;
    isOwner: boolean;
};
export class CreateChecklistItemDto {
    guideId: string;
    order: number;
    label: string;
    recommended?: boolean;
}

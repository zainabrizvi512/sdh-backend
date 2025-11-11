export class CreateQuickActionDto {
    guideId: string;
    order: number;
    type: 'CALL' | 'SMS' | 'URL' | 'MAP';
    label: string;
    payload?: string;
    icon?: string;
}

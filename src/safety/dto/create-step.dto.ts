export class CreateStepDto {
    guideId: string;

    phase: 'BEFORE' | 'DURING' | 'AFTER';

    order: number;

    title: string;

    body: string;

    icon?: string;
}

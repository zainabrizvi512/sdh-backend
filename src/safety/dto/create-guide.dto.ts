export class CreateGuideDto {
    disasterTypeId: string;

    title: string;

    locale: string;

    regionCity?: string;
    regionProvince?: string;

    published?: boolean;
}

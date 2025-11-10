// send-message.dto.ts
import { MessageType } from '../message.entity';

export enum MessageKindEnum {
    TEXT = "text",
    LOCATION = "location",
    SYSTEM = "system",
    AUDIO = "audio",
    IMAGE = "image"
}

class AttachmentInput {
    url: string;
    contentType?: string;
    sizeBytes?: number;
    caption?: string;
}

class LocationDto {
    lat!: number;
    lng!: number;
    accuracy?: number;
}

export class SendMessageDto {
    kind!: MessageKindEnum;
    type: MessageType;
    text?: string;
    attachments?: AttachmentDto[];
    location?: LocationDto;
}

export class AttachmentDto {
    url: string;
    mime?: string;            // e.g. 'audio/m4a'
    durationMs?: number;      // for audio
    width?: number;           // for images (optional)
    height?: number;          // for images (optional)
    // ...any other fields you store
}

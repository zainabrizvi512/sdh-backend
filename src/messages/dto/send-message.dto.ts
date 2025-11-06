// send-message.dto.ts
import { MessageType } from '../message.entity';

class AttachmentInput {
    url: string;
    contentType?: string;
    sizeBytes?: number;
    caption?: string;
}

export class SendMessageDto {
    type: MessageType;
    text?: string;
    attachments?: AttachmentInput[];
}

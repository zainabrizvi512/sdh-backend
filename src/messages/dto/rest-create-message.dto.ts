// src/messages/dto/rest-create-message.dto.ts
import { MessageType } from '../message.entity';

export class RestCreateMessageBody {
  /** "TEXT" | "IMAGE" | "AUDIO" | "LOCATION" */
  type!: MessageType;

  /** Optional when TEXT/IMAGE/AUDIO; required if you want caption for images/audio */
  text?: string;

  /** JSON string when type === LOCATION (e.g. {"lat":33.7,"lng":73.0,"accuracy":12}) */
  location?: string;

  /** JSON string for optional audio/image metadata per file, matched by index.
   *  e.g. '[{"durationMs": 2300}, {"durationMs": 1200}]' */
  attachmentsMeta?: string;
}

// src/messages/messages.rest.controller.ts
import {
    BadRequestException,
    Body,
    Controller,
    Param,
    Post,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { MessagesService } from './messages.service';
import { MessageType } from './message.entity';
import { RestCreateMessageBody } from './dto/rest-create-message.dto';
import { StorageService } from 'src/storage/storage.service';
import type { Server } from 'socket.io';
import { MessagesGateway } from './messages.gateway';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

type Uploaded = { files?: Express.Multer.File[] };

@UseGuards(JwtAuthGuard)
@Controller('groups/rest/:groupId/messages')
export class MessagesRestController {
    constructor(
        private readonly messages: MessagesService,
        private readonly storage: StorageService,
        private readonly gateway: MessagesGateway, // ✅ inject gateway
    ) { }

    @Post()
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                // multiple payload keys are supported; front-end can send in either
                { name: 'files', maxCount: 5 },
                { name: 'images', maxCount: 5 },
                { name: 'audio', maxCount: 1 },
            ],
            {
                limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
            },
        ),
    )
    async createMessage(
        @Req() req: Request & { user?: any },
        @Param('groupId') groupId: string,
        @Body() body: RestCreateMessageBody,
        @UploadedFiles() uploaded: Uploaded,
    ) {
        try {
            console.log("create message");
            const currentUserId = req.user?.sub;
            console.log(currentUserId);
            if (!currentUserId) throw new BadRequestException('Auth required');
            console.log(body)
            // 1) Basic type validation (accept TEXT | IMAGE | AUDIO | LOCATION)
            const type = this.normalizeType(body.type);
            if (!type) throw new BadRequestException('Invalid type');

            // 2) Build SendMessageDto
            const dto: any = { kind: type };

            // 2a) Location
            if (type === MessageType.LOCATION) {
                if (!body.location) throw new BadRequestException('location required');
                dto.location = this.parseJSON(body.location, 'location');
                if (
                    typeof dto.location?.lat !== 'number' ||
                    typeof dto.location?.lng !== 'number'
                ) {
                    throw new BadRequestException('location.lat/lng must be numbers');
                }
            }

            // 2b) Text (caption or plain text)
            if (body.text && body.text.trim().length > 0) {
                dto.text = body.text.trim();
            }

            // 2c) Attachments (images/audio)
            const files =
                uploaded?.files ??
                ([] as Express.Multer.File[]).concat(
                    (uploaded as any)?.images ?? [],
                    (uploaded as any)?.audio ?? [],
                );

            if (type === MessageType.IMAGE || type === MessageType.AUDIO) {
                if (!files?.length) {
                    throw new BadRequestException(`${type} requires at least one file`);
                }

                // Optional per-file metadata
                const attMeta: Array<{ durationMs?: number;[k: string]: any }> =
                    body.attachmentsMeta ? this.parseJSON(body.attachmentsMeta, 'attachmentsMeta') : [];

                const attachments = [];
                for (let i = 0; i < files.length; i++) {
                    const f = files[i];

                    // allowlist
                    if (type === MessageType.IMAGE) {
                        if (!/^image\/(png|jpe?g|webp|gif|heic)$/i.test(f.mimetype)) {
                            throw new BadRequestException('Only image files allowed for IMAGE');
                        }
                    } else if (type === MessageType.AUDIO) {
                        if (!/^audio\/(m4a|mp4|aac|mpeg|ogg|wav|x-m4a)$/i.test(f.mimetype) && !/^audio\//.test(f.mimetype)) {
                            throw new BadRequestException('Only audio files allowed for AUDIO');
                        }
                    }

                    // upload to GCS
                    const ext = this.guessExt(f);
                    const destPath = `chat/${groupId}/${Date.now()}-${i}-${this.safeName(
                        f.originalname || `file${i}${ext}`,
                    )}`;
                    const publicUrl = await this.storage.uploadBuffer({
                        buffer: f.buffer,
                        contentType: f.mimetype,
                        destPath,
                        makePublic: true, // or false + sign URLs on read
                    });

                    const meta = attMeta[i] || {};
                    attachments.push({
                        url: publicUrl,
                        mime: f.mimetype,
                        durationMs: typeof meta.durationMs === 'number' ? meta.durationMs : undefined,
                        width: typeof meta.width === 'number' ? meta.width : undefined,
                        height: typeof meta.height === 'number' ? meta.height : undefined,
                    });
                }
                dto.attachments = attachments;
            }

            // 3) Persist
            const saved = await this.messages.sendMessage(currentUserId, groupId, dto);

            // 4) Broadcast over WebSocket (/chat namespace), same as your gateway

            const io: Server = this.gateway.server;
            io?.to(`group:${groupId}`)?.emit?.('new_message', saved);
            return saved;
        } catch (e) {
            // non-blocking
            console.log(e);
            return e;
        }
    }

    // ---------- helpers ----------
    private parseJSON<T = any>(raw: any, label: string): T {
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
            throw new BadRequestException(`Invalid JSON for ${label}`);
        }
    }

    private normalizeType(t?: any): MessageType | null {
        if (!t) return null;
        const up = t;
        if (
            up === MessageType.TEXT ||
            up === MessageType.IMAGE ||
            up === MessageType.LOCATION ||
            up === MessageType.AUDIO
        )
            return up as MessageType;
        return null;
    }

    private safeName(name: string) {
        return name.replace(/[^\w.\-]+/g, '_').slice(0, 120);
    }

    private guessExt(f: Express.Multer.File) {
        const m = f.mimetype || '';
        if (m.startsWith('image/')) return `.${m.split('/')[1]}`;
        if (m.startsWith('audio/')) return `.${m.split('/')[1]}`;
        return '';
    }
}

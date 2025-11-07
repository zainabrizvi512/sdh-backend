// uploads.controller.ts
import { Controller, Get, Query, Req, BadRequestException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

function createStorage() {
    // Prefer ADC if running on GCP. If not, fall back to explicit credentials.
    if (process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY) {
        return new Storage({
            projectId: process.env.GCP_PROJECT_ID,
            credentials: {
                client_email: process.env.GCP_CLIENT_EMAIL,
                private_key: process
                    .env
                    .GCP_PRIVATE_KEY!
                    .replace(/\\n/g, '\n'), // fix escaped newlines from .env
            },
        });
    }
    return new Storage({ projectId: process.env.GCP_PROJECT_ID });
}

@Controller('uploads')
export class UploadsController {
    private storage = createStorage();
    private bucket = this.storage.bucket(process.env.GCS_BUCKET!);

    /**
     * Returns a short-lived v4 signed URL for PUT (upload) and an optional READ URL.
     * Client flow:
     *   1) GET /uploads/presign?contentType=image/png
     *   2) PUT file to uploadUrl with header `Content-Type: <contentType>`
     *   3) Use `viewUrl` (signed read) in your message attachment, OR use the public URL if your bucket/objects are public
     */
    @Get('presign')
    async presign(
        @Req() req: any,
        @Query('contentType') contentType?: string,
        @Query('readSeconds') readSeconds?: string, // optional: signed READ URL lifetime
    ) {
        if (!contentType) {
            throw new BadRequestException('contentType is required');
        }
        const userId = req.user?.id ?? 'anon';
        const objectName = `chat/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const file = this.bucket.file(objectName);

        // v4 signed URL for upload (PUT). Must set the same Content-Type on PUT.
        const [uploadUrl] = await file.getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + 60 * 1000, // 60s
            contentType,
        });

        // Optional: a v4 signed READ URL for clients to display image without making it public
        let viewUrl: string | undefined;
        const ttlSec = Math.min(parseInt(readSeconds || '604800', 10) || 604800, 604800); // cap at 7 days
        [viewUrl] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + ttlSec * 1000,
        });

        // Public URL (only works if object/bucket is readable without auth)
        const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${encodeURIComponent(objectName)}`;

        return {
            uploadUrl,
            viewUrl,      // use this in attachments if you keep objects private
            publicUrl,    // use this if you make objects public
            objectPath: objectName,
            bucket: process.env.GCS_BUCKET,
            requiredHeaders: { 'Content-Type': contentType },
        };
    }
}

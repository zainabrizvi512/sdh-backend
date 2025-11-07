import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

type UploadArgs = {
    buffer: Buffer;
    contentType: string;
    destPath: string;
    makePublic?: boolean;
};

@Injectable()
export class StorageService {
    // Because GOOGLE_APPLICATION_CREDENTIALS is set,
    // the SDK will automatically use that file for credentials.
    private storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID,
    });

    private bucket = this.storage.bucket(process.env.GCS_BUCKET!);

    async uploadBuffer({ buffer, contentType, destPath }: UploadArgs) {
        const file = this.bucket.file(destPath);

        await file.save(buffer, {
            resumable: true,
            contentType,
            metadata: { cacheControl: 'public, max-age=31536000' },
        });

        if (true) {
            // Bucket has allUsers:objectViewer and PAP not enforced
            return `https://storage.googleapis.com/${this.bucket.name}/${file.name}`;
        } else {
            const [url] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + 60 * 60 * 1000,
            });
            return url;
        }
    }
}

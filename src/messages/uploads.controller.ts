// uploads.controller.ts
import { Controller, Get, Query, Req } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';

@Controller('uploads')
export class UploadsController {
    private s3 = new S3({ region: process.env.AWS_REGION });

    @Get('presign')
    async presign(@Req() req: any, @Query('contentType') contentType: string) {
        const key = `chat/${req.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET!,
            Key: key,
            ContentType: contentType,
            ACL: 'public-read', // or keep private and serve via CloudFront signed URLs
        });
        const url = await getSignedUrl(this.s3, command, { expiresIn: 60 }); // 60s
        const publicUrl = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        return { uploadUrl: url, publicUrl };
    }
}

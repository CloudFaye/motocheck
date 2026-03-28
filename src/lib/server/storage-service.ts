import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config';

const s3Client = new S3Client({
	region: 'auto',
	endpoint: config.R2_ENDPOINT,
	credentials: {
		accessKeyId: config.R2_ACCESS_KEY_ID,
		secretAccessKey: config.R2_SECRET_ACCESS_KEY
	}
});

export interface UploadResult {
	r2Key: string;
	signedUrl: string;
}

export async function uploadReport(reportId: string, pdfBuffer: Buffer): Promise<UploadResult> {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const r2Key = `reports/${year}/${month}/${reportId}.pdf`;

	await s3Client.send(
		new PutObjectCommand({
			Bucket: config.R2_BUCKET_NAME,
			Key: r2Key,
			Body: pdfBuffer,
			ContentType: 'application/pdf'
		})
	);

	const signedUrl = await generateSignedUrl(r2Key, 72);

	return { r2Key, signedUrl };
}

export async function generateSignedUrl(r2Key: string, expiryHours: number): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: config.R2_BUCKET_NAME,
		Key: r2Key
	});

	return getSignedUrl(s3Client, command, { expiresIn: expiryHours * 3600 });
}

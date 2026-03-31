import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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
	reportId: string;
	format: 'pdf' | 'docx';
}

export async function uploadReport(
	reportId: string, 
	buffer: Buffer, 
	format: 'pdf' | 'docx' = 'pdf'
): Promise<UploadResult> {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	
	const extension = format === 'docx' ? '.docx' : '.pdf';
	const mimeType = format === 'docx' 
		? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		: 'application/pdf';
	
	const r2Key = `reports/${year}/${month}/${reportId}${extension}`;

	await s3Client.send(
		new PutObjectCommand({
			Bucket: config.R2_BUCKET_NAME,
			Key: r2Key,
			Body: buffer,
			ContentType: mimeType
		})
	);

	return { r2Key, reportId, format };
}

export async function getReport(r2Key: string): Promise<Buffer> {
	const command = new GetObjectCommand({
		Bucket: config.R2_BUCKET_NAME,
		Key: r2Key
	});

	const response = await s3Client.send(command);
	const stream = response.Body;

	if (!stream) {
		throw new Error('No data returned from R2');
	}

	// Convert stream to buffer
	const chunks: Uint8Array[] = [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	for await (const chunk of stream as any) {
		chunks.push(chunk);
	}

	return Buffer.concat(chunks);
}

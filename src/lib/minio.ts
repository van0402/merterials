import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';

const rawEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const useSSL = process.env.MINIO_USE_SSL === 'true';
const port = process.env.MINIO_PORT || '9000';
const endpoint = /^https?:\/\//i.test(rawEndpoint)
  ? rawEndpoint.replace(/\/$/, '')
  : `http${useSSL ? 's' : ''}://${rawEndpoint}:${port}`;
const region = process.env.MINIO_REGION || 'us-east-1';
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
const bucket = process.env.MINIO_BUCKET || 'refferq';
const publicUrl = (process.env.MINIO_PUBLIC_URL || endpoint).replace(/\/$/, '');

const s3 = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
});

export const minioBucket = bucket;

export const minioClient = {
  async putObject(bucketName: string, objectName: string, buffer: Buffer, _size: number, headers?: Record<string, string>) {
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: objectName,
      Body: buffer,
      ContentType: headers?.['Content-Type'],
    }));
  },
  async removeObject(bucketName: string, objectName: string) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: objectName }));
  },
};

let bucketReady: Promise<void> | null = null;

export async function ensureMinioBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      try {
        await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch {
        try {
          await s3.send(new CreateBucketCommand({ Bucket: bucket }));
        } catch (error) {
          console.warn('Không thể tạo/kiểm tra bucket, giả định đã có sẵn:', error);
        }
      }
    })();
  }
  await bucketReady;
}

export function getMinioPublicUrl(objectName: string) {
  return `${publicUrl}/${bucket}/${objectName}`;
}

export function getMinioObjectNameFromUrl(url: string): string | null {
  const prefix = `${publicUrl}/${bucket}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}
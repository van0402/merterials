import { promises as fs } from 'fs';
import path from 'path';
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
// Có UPLOAD_DIR thì lưu file thẳng vào thư mục này (VPS), không dùng S3/MinIO.
const uploadDir = process.env.UPLOAD_DIR;

const s3 = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
});

export const minioBucket = bucket;

function localPath(objectName: string) {
  const root = path.resolve(uploadDir as string);
  const full = path.resolve(root, objectName);
  if (!full.startsWith(root + path.sep)) throw new Error('Đường dẫn file không hợp lệ');
  return full;
}

export const minioClient = {
  async putObject(bucketName: string, objectName: string, buffer: Buffer, _size: number, headers?: Record<string, string>) {
    if (uploadDir) {
      const full = localPath(objectName);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, buffer);
      return;
    }
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: objectName,
      Body: buffer,
      ContentType: headers?.['Content-Type'],
    }));
  },
  async removeObject(bucketName: string, objectName: string) {
    if (uploadDir) {
      await fs.rm(localPath(objectName), { force: true });
      return;
    }
    await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: objectName }));
  },
};

let bucketReady: Promise<void> | null = null;

export async function ensureMinioBucket() {
  if (uploadDir) return;
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
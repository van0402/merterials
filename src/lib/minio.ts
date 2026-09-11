import { Client } from 'minio';

const rawEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const endpointUrl = /^https?:\/\//i.test(rawEndpoint) ? new URL(rawEndpoint) : null;
const endpoint = endpointUrl?.hostname || rawEndpoint;
const port = Number(process.env.MINIO_PORT || endpointUrl?.port || 9000);
const useSSL = process.env.MINIO_USE_SSL === 'true' || endpointUrl?.protocol === 'https:';
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
const bucket = process.env.MINIO_BUCKET || 'refferq';
const publicUrl = (process.env.MINIO_PUBLIC_URL || `http${useSSL ? 's' : ''}://${endpoint}:${port}`).replace(/\/$/, '');

export const minioClient = new Client({
  endPoint: endpoint,
  port,
  useSSL,
  accessKey,
  secretKey,
});

export const minioBucket = bucket;

let bucketReady: Promise<void> | null = null;
let policyReady: Promise<void> | null = null;

export async function ensureMinioBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket);
      }
    })();
  }

  await bucketReady;

  if (!policyReady) {
    policyReady = minioClient.setBucketPolicy(bucket, JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [
            `arn:aws:s3:::${bucket}/avatars/*`,
            `arn:aws:s3:::${bucket}/program-banners/*`,
          ],
        },
      ],
    })).catch((error) => {
      console.warn('MinIO bucket policy setup failed; continuing with upload:', error);
    });
  }

  await policyReady;
}

export function getMinioPublicUrl(objectName: string) {
  return `${publicUrl}/${bucket}/${objectName}`;
}

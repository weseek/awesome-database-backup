import {
  S3Client,
  DeleteObjectCommand,
  DeleteBucketCommand,
  CreateBucketCommand,
  ListBucketsCommand,
  ListObjectsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { fixturePath } from './fixtures';
import { s3ClientConfig, testS3BucketName } from './config/minio';

const s3client = new S3Client(s3ClientConfig);

export async function cleanTestS3Bucket(): Promise<void> {
  const buckets = await s3client.send(new ListBucketsCommand({}));
  if (buckets?.Buckets?.find(bucket => bucket.Name === testS3BucketName)) {
    const objects = await s3client.send(new ListObjectsCommand({ Bucket: testS3BucketName }));
    const deleteObjectPromises = objects.Contents?.map(object => s3client.send(new DeleteObjectCommand({ Bucket: testS3BucketName, Key: object.Key })));
    if (deleteObjectPromises) {
      await Promise.all(deleteObjectPromises);
    }
    await s3client.send(new DeleteBucketCommand({ Bucket: testS3BucketName }));
  }
  await s3client.send(new CreateBucketCommand({ Bucket: testS3BucketName }));
}

export async function uploadFixtureToTestS3Bucket(fixtureName: string, newFixtureName?: string): Promise<void> {
  await s3client.send(new PutObjectCommand({
    Bucket: testS3BucketName,
    Key: newFixtureName || fixtureName,
    Body: readFileSync(fixturePath(fixtureName)),
  }));
}

export async function listFileNamesInTestS3Bucket(): Promise<Array<string>> {
  const objects = await s3client.send(new ListObjectsCommand({ Bucket: testS3BucketName }));
  const fileNames = objects.Contents?.map(object => object.Key || '') || [];
  return fileNames;
}

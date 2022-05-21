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
import { createPGBackup } from '@awesome-backup/postgresql-test';
import { createMongoDBBackup } from '@awesome-backup/mongodb-test';
import { createMariaDBBackup } from '@awesome-backup/mariadb-test';
import { basename } from 'path';
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

export async function uploadPGFixtureToTestS3Bucket(fixtureName: string): Promise<void> {
  const fixturePath = createPGBackup(fixtureName);
  await s3client.send(new PutObjectCommand({
    Bucket: testS3BucketName,
    Key: basename(fixturePath),
    Body: readFileSync(fixturePath),
  }));
}

export async function uploadMongoDBFixtureToTestS3Bucket(fixtureName: string): Promise<void> {
  const fixturePath = createMongoDBBackup(fixtureName);
  await s3client.send(new PutObjectCommand({
    Bucket: testS3BucketName,
    Key: basename(fixturePath),
    Body: readFileSync(fixturePath),
  }));
}

export async function uploadMariaDBFixtureToTestS3Bucket(fixtureName: string): Promise<void> {
  const fixturePath = createMariaDBBackup(fixtureName);
  await s3client.send(new PutObjectCommand({
    Bucket: testS3BucketName,
    Key: basename(fixturePath),
    Body: readFileSync(fixturePath),
  }));
}

export async function listFileNamesInTestS3Bucket(): Promise<Array<string>> {
  const objects = await s3client.send(new ListObjectsCommand({ Bucket: testS3BucketName }));
  const fileNames = objects.Contents?.map(object => object.Key || '') || [];
  return fileNames;
}

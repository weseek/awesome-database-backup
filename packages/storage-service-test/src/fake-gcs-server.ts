import { Storage } from '@google-cloud/storage';
import { fixturePath } from './fixtures';
import { storageConfig, testGCSBucketName } from './config/fake-gcs-server';

const storage = new Storage(storageConfig);

export async function cleanTestGCSBucket(): Promise<void> {
  await storage.createBucket(testGCSBucketName);
  await storage.bucket(testGCSBucketName).deleteFiles({ force: true });
  await storage.bucket(testGCSBucketName).delete({ ignoreNotFound: true });
  await storage.createBucket(testGCSBucketName);
}

export async function uploadFixtureToTestGCSBucket(fixtureName: string, newFixtureName?: string): Promise<void> {
  await storage.bucket(testGCSBucketName).upload(fixturePath(fixtureName), {
    destination: newFixtureName || fixtureName,
  });
}

export async function listFileNamesInTestGCSBucket(): Promise<Array<string>> {
  const files = (await storage.bucket(testGCSBucketName).getFiles())[0];
  return files.map(file => file.name);
}

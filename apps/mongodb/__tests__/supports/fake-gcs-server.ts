import { Storage } from '@google-cloud/storage';
import { fixturePath } from '../fixtures';

const storage = new Storage({
  projectId: 'valid_project_id',
  credentials: {
    client_email: 'valid@example.com',
    private_key: 'valid_private_key',
  },
  apiEndpoint: 'http://fake-gcs-server:4443',
});

export const testGCSBucketName = 'test';
export const testGCSBucketURI = `gs://${testGCSBucketName}`;
export async function cleanTestGCSBucket(): Promise<void> {
  await storage.createBucket(testGCSBucketName);
  await storage.bucket(testGCSBucketName).deleteFiles({ force: true });
  await storage.bucket(testGCSBucketName).delete({ ignoreNotFound: true });
  await storage.createBucket(testGCSBucketName);
}

export async function uploadFixtureToTestBucket(fixtureName: string): Promise<void> {
  await storage.bucket(testGCSBucketName).upload(fixturePath(fixtureName), {
    destination: fixtureName,
  });
}

export async function listFileNamesInTestBucket(): Promise<Array<string>> {
  const files = (await storage.bucket(testGCSBucketName).getFiles())[0];
  return files.map(file => file.name);
}

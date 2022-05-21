import { Storage } from '@google-cloud/storage';
import { createPGBackup } from '@awesome-backup/postgresql-test';
import { createMongoDBBackup } from '@awesome-backup/mongodb-test';
import { createMariaDBBackup } from '@awesome-backup/mariadb-test';
import { basename } from 'path';
import { storageConfig, testGCSBucketName } from './config/fake-gcs-server';

const storage = new Storage(storageConfig);

export async function cleanTestGCSBucket(): Promise<void> {
  await storage.createBucket(testGCSBucketName);
  await storage.bucket(testGCSBucketName).deleteFiles({ force: true });
  await storage.bucket(testGCSBucketName).delete({ ignoreNotFound: true });
  await storage.createBucket(testGCSBucketName);
}

export async function uploadPGFixtureToTestGCSBucket(fixtureName: string): Promise<void> {
  const fixturePath = createPGBackup(fixtureName);
  await storage.bucket(testGCSBucketName).upload(
    fixturePath,
    {
      destination: basename(fixturePath),
    },
  );
}

export async function uploadMongoDBFixtureToTestGCSBucket(fixtureName: string): Promise<void> {
  const fixturePath = createMongoDBBackup(fixtureName);
  await storage.bucket(testGCSBucketName).upload(
    fixturePath,
    {
      destination: basename(fixturePath),
    },
  );
}

export async function uploadMariaDBFixtureToTestGCSBucket(fixtureName: string): Promise<void> {
  const fixturePath = createMariaDBBackup(fixtureName);
  await storage.bucket(testGCSBucketName).upload(
    fixturePath,
    {
      destination: basename(fixturePath),
    },
  );
}

export async function listFileNamesInTestGCSBucket(): Promise<Array<string>> {
  const files = (await storage.bucket(testGCSBucketName).getFiles())[0];
  return files.map(file => file.name);
}

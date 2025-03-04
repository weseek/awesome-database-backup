import { Storage } from '@google-cloud/storage';
import { createPGBackup } from '@awesome-database-backup/postgresql-test';
import { createMongoDBBackup } from '@awesome-database-backup/mongodb-test';
import { createMariaDBBackup } from '@awesome-database-backup/mariadb-test';
import { createFileBackup } from '@awesome-database-backup/file-test';
import { basename } from 'path';
import { storageConfig, testGCSBucketName } from './config/fake-gcs-server';

const storage = new Storage(storageConfig);

export async function cleanTestGCSBucket(): Promise<void> {
  const [exists] = await storage.bucket(testGCSBucketName).exists();
  if (exists) {
    await storage.bucket(testGCSBucketName).deleteFiles({ force: true });
  }
  else {
    await storage.createBucket(testGCSBucketName);
  }
}

export async function uploadPGFixtureToTestGCSBucket(fixtureName: string): Promise<void> {
  const fixturePath = await createPGBackup(fixtureName);
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
  const fixturePath = await createMariaDBBackup(fixtureName);
  await storage.bucket(testGCSBucketName).upload(
    fixturePath,
    {
      destination: basename(fixturePath),
    },
  );
}

export async function uploadFileFixtureToTestGCSBucket(fixtureName: string): Promise<void> {
  const fixturePath = await createFileBackup(fixtureName);
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

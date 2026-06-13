import {
  describe, beforeEach, it, expect,
} from 'vitest';
import { exec as execOriginal } from 'node:child_process';
import { promisify } from 'node:util';
import {
  s3ClientConfig,
  testS3BucketURI,
  cleanTestS3Bucket,
  uploadMongoDBFixtureToTestS3Bucket,
  uploadMongoDBArchiveFixtureToTestS3Bucket,
  storageConfig,
  testGCSBucketURI,
  initFakeGCSServer,
  cleanTestGCSBucket,
  uploadMongoDBFixtureToTestGCSBucket,
  uploadMongoDBArchiveFixtureToTestGCSBucket,
} from '@awesome-database-backup/storage-service-test';
import {
  dropTestMongoDB,
  prepareTestMongoDB,
  listCollectionNamesInTestMongoDB,
  mongodbURI,
  testMongoDBName,
} from '@awesome-database-backup/mongodb-test';

const exec = promisify(execOriginal);

const execRestoreCommand = 'yarn run ts-node src/restore';

describe('restore', () => {
  describe('when option --help is specified', () => {
    const commandLine = `${execRestoreCommand} --help`;
    it('show help messages', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('Usage:'),
        stderr: '',
      });
    });
  });

  describe('when no option is specified', () => {
    const commandLine = `${execRestoreCommand}`;
    it('throw error message', async() => {
      await expect(exec(commandLine)).rejects.toThrowError(
        /required option '--target-bucket-url <TARGET_BUCKET_URL> \*\*MANDATORY\*\*' not specified/,
      );
    });
  });

  describe('when valid S3 options are specified', () => {
    const objectURI = `${testS3BucketURI}/${testMongoDBName}.tar.zst`;
    const commandLine = `${execRestoreCommand} \
      --aws-endpoint-url ${s3ClientConfig.endpoint} \
      --aws-region ${s3ClientConfig.region} \
      --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
      --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
      --restore-tool-options "--uri ${mongodbURI}" \
      --target-bucket-url ${objectURI}`;

    beforeEach(cleanTestS3Bucket);
    beforeEach(dropTestMongoDB);
    beforeEach(async() => {
      await uploadMongoDBFixtureToTestS3Bucket(testMongoDBName); // includes 'dummy' collection
    });

    it('restore mongo in bucket', async() => {
      expect(await listCollectionNamesInTestMongoDB()).toEqual([]);
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.ts started at .* ===/),
        stderr: '',
      });
      expect(await listCollectionNamesInTestMongoDB()).toEqual(['dummy']);
    });
  });

  describe('when valid S3 options are specified (archive format)', () => {
    const objectURI = `${testS3BucketURI}/${testMongoDBName}.zst`;
    const commandLine = `${execRestoreCommand} \
      --aws-endpoint-url ${s3ClientConfig.endpoint} \
      --aws-region ${s3ClientConfig.region} \
      --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
      --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
      --mongodb-archive-format \
      --restore-tool-options "--uri ${mongodbURI}" \
      --target-bucket-url ${objectURI}`;

    beforeEach(cleanTestS3Bucket);
    beforeEach(dropTestMongoDB);
    beforeEach(prepareTestMongoDB);
    beforeEach(async() => {
      await uploadMongoDBArchiveFixtureToTestS3Bucket(testMongoDBName);
    });
    beforeEach(dropTestMongoDB);

    it('restore mongo archive from S3 bucket', async() => {
      expect(await listCollectionNamesInTestMongoDB()).toEqual([]);
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.ts started at .* ===/),
        stderr: '',
      });
      expect(await listCollectionNamesInTestMongoDB()).toEqual(['dummy']);
    });
  });

  describe('when valid GCS options are specified', () => {
    const objectURI = `${testGCSBucketURI}/${testMongoDBName}.tar.zst`;
    const commandLine = `${execRestoreCommand} \
      --gcp-endpoint-url ${storageConfig.apiEndpoint} \
      --gcp-project-id ${storageConfig.projectId} \
      --gcp-client-email ${storageConfig.credentials.client_email} \
      --gcp-private-key ${storageConfig.credentials.private_key} \
      --restore-tool-options "--uri ${mongodbURI}" \
      --target-bucket-url ${objectURI}`;

    beforeEach(initFakeGCSServer);
    beforeEach(cleanTestGCSBucket);
    beforeEach(dropTestMongoDB);
    beforeEach(async() => {
      await uploadMongoDBFixtureToTestGCSBucket(testMongoDBName); // includes 'dummy' collection
    });

    it('restore mongo in bucket', async() => {
      expect(await listCollectionNamesInTestMongoDB()).toEqual([]);
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.ts started at .* ===/),
        stderr: '',
      });
      expect(await listCollectionNamesInTestMongoDB()).toEqual(['dummy']);
    });
  });

  describe('when valid GCS options are specified (archive format)', () => {
    const objectURI = `${testGCSBucketURI}/${testMongoDBName}.zst`;
    const commandLine = `${execRestoreCommand} \
      --gcp-endpoint-url ${storageConfig.apiEndpoint} \
      --gcp-project-id ${storageConfig.projectId} \
      --gcp-client-email ${storageConfig.credentials.client_email} \
      --gcp-private-key ${storageConfig.credentials.private_key} \
      --mongodb-archive-format \
      --restore-tool-options "--uri ${mongodbURI}" \
      --target-bucket-url ${objectURI}`;

    beforeEach(initFakeGCSServer);
    beforeEach(cleanTestGCSBucket);
    beforeEach(dropTestMongoDB);
    beforeEach(prepareTestMongoDB);
    beforeEach(async() => {
      await uploadMongoDBArchiveFixtureToTestGCSBucket(testMongoDBName);
    });
    beforeEach(dropTestMongoDB);

    it('restore mongo archive from GCS bucket', async() => {
      expect(await listCollectionNamesInTestMongoDB()).toEqual([]);
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.ts started at .* ===/),
        stderr: '',
      });
      expect(await listCollectionNamesInTestMongoDB()).toEqual(['dummy']);
    });
  });
});

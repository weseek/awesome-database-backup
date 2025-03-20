import {
  describe, beforeEach, it, expect,
} from 'vitest';
import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import {
  s3ClientConfig,
  testS3BucketURI,
  cleanTestS3Bucket,
  uploadFileFixtureToTestS3Bucket,
  storageConfig,
  testGCSBucketURI,
  cleanTestGCSBucket,
  uploadFileFixtureToTestGCSBucket,
} from '@awesome-database-backup/storage-service-test';
import {
  listFileNamesInTestDir,
  testFileName,
  getTestDirPath,
  clearTestDir,
} from '@awesome-database-backup/file-test';

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
    const objectURI = `${testS3BucketURI}/${testFileName}.tar.gz`;
    const commandLine = `${execRestoreCommand} \
      --aws-endpoint-url ${s3ClientConfig.endpoint} \
      --aws-region ${s3ClientConfig.region} \
      --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
      --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
      --target-bucket-url ${objectURI}`;

    beforeEach(cleanTestS3Bucket);
    beforeEach(clearTestDir);
    beforeEach(async() => {
      await uploadFileFixtureToTestS3Bucket(testFileName); // includes 'dummy' table
    });

    it('restore File in bucket', async() => {
      expect(await listFileNamesInTestDir()).toEqual([]);
      expect(await exec(`${commandLine} --restore-tool-options "-C ${getTestDirPath()}"`)).toEqual({
        stdout: expect.stringMatching(/=== restore.ts started at .* ===/),
        stderr: '',
      });
      expect(await listFileNamesInTestDir()).toEqual(['dummy']);
    });
  });

  describe('when valid GCS options are specified', () => {
    const objectURI = `${testGCSBucketURI}/${testFileName}.tar.gz`;
    const commandLine = `${execRestoreCommand} \
      --gcp-endpoint-url ${storageConfig.apiEndpoint} \
      --gcp-project-id ${storageConfig.projectId} \
      --gcp-client-email ${storageConfig.credentials.client_email} \
      --gcp-private-key ${storageConfig.credentials.private_key} \
      --target-bucket-url ${objectURI}`;
    beforeEach(cleanTestGCSBucket);
    beforeEach(clearTestDir);
    beforeEach(async() => {
      await uploadFileFixtureToTestGCSBucket(testFileName); // includes 'dummy' table
    });

    it('restore File in bucket', async() => {
      expect(await listFileNamesInTestDir()).toEqual([]);
      expect(await exec(`${commandLine} --restore-tool-options "-C ${getTestDirPath()}"`)).toEqual({
        stdout: expect.stringMatching(/=== restore.ts started at .* ===/),
        stderr: '',
      });
      expect(await listFileNamesInTestDir()).toEqual(['dummy']);
    });
  });
});

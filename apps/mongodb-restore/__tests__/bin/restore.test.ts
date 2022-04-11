import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import {
  s3ClientConfig,
  cleanTestS3Bucket,
  uploadFixtureToTestS3Bucket,
  storageConfig,
  testGCSBucketURI,
  cleanTestGCSBucket,
  uploadFixtureToTestGCSBucket,
} from '@awesome-backup/storage-service-test';
import {
  dropTestMongoDB,
  listCollectionNamesInTestMongoDB,
  mongodbURI,
} from '@awesome-backup/mongodb-test';

const exec = promisify(execOriginal);

const execRestoreCommand = 'yarn run ts-node src/bin/restore';

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
        /missing required argument 'TARGET_BUCKET_URL'/,
      );
    });
  });

  describe('when valid S3 options are specified', () => {
    const bucketURI = 's3://test/';
    const objectURI = `${bucketURI}backup-20220327224212.tar.bz2`;
    const commandLine = `${execRestoreCommand} \
      --aws-endpoint-url ${s3ClientConfig.endpoint} \
      --aws-region ${s3ClientConfig.region} \
      --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
      --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
      --restore-tool-options "--uri ${mongodbURI}" \
      ${objectURI}`;

    beforeEach(cleanTestS3Bucket);
    beforeEach(dropTestMongoDB);
    beforeEach(async() => {
      await uploadFixtureToTestS3Bucket('backup-20220327224212.tar.bz2'); // includes 'dummy' collection
    });

    it('restore mongo in bucket', async() => {
      expect(await listCollectionNamesInTestMongoDB()).toEqual([]);
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.js started at .* ===/),
        stderr: '',
      });
      expect(await listCollectionNamesInTestMongoDB()).toEqual(['dummy']);
    });
  });

  describe('when valid GCS options are specified', () => {
    const objectURI = `${testGCSBucketURI}/backup-20220327224212.tar.bz2`;
    const commandLine = `${execRestoreCommand} \
      --gcp-endpoint-url ${storageConfig.apiEndpoint} \
      --gcp-project-id ${storageConfig.projectId} \
      --gcp-client-email ${storageConfig.credentials.client_email} \
      --gcp-private-key ${storageConfig.credentials.private_key} \
      --restore-tool-options "--uri ${mongodbURI}" \
      ${objectURI}`;

    beforeEach(cleanTestGCSBucket);
    beforeEach(dropTestMongoDB);
    beforeEach(async() => {
      await uploadFixtureToTestGCSBucket('backup-20220327224212.tar.bz2'); // includes 'dummy' collection
    });

    it('restore mongo in bucket', async() => {
      expect(await listCollectionNamesInTestMongoDB()).toEqual([]);
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.js started at .* ===/),
        stderr: '',
      });
      expect(await listCollectionNamesInTestMongoDB()).toEqual(['dummy']);
    });
  });
});

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
  cleanTestPG,
  listTableNamesInTestPG,
  postgresqlConfig,
} from '@awesome-backup/postgresql-test';

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
    const objectURI = `${bucketURI}backup-20220402000000.tar.bz2`;
    const commandLine = `PGPASSWORD="password" \
      ${execRestoreCommand} \
      --aws-endpoint-url ${s3ClientConfig.endpoint} \
      --aws-region ${s3ClientConfig.region} \
      --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
      --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
      --restore-tool-options "--host ${postgresqlConfig.host} --username ${postgresqlConfig.user}" \
      ${objectURI}`;

    beforeEach(cleanTestS3Bucket);
    beforeEach(cleanTestPG);
    beforeEach(async() => {
      await uploadFixtureToTestS3Bucket('backup-20220402000000.tar.bz2'); // includes 'dummy' table
    });

    it('restore PostgreSQL in bucket', async() => {
      expect(await listTableNamesInTestPG()).toEqual([]);
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.js started at .* ===/),
        stderr: '',
      });
      expect(await listTableNamesInTestPG()).toEqual(['dummy']);
    });
  });

  describe('when valid GCS options are specified', () => {
    const objectURI = `${testGCSBucketURI}/backup-20220402000000.tar.bz2`;
    const commandLine = `PGPASSWORD="password" \
      ${execRestoreCommand} \
      --gcp-endpoint-url ${storageConfig.apiEndpoint} \
      --gcp-project-id ${storageConfig.projectId} \
      --gcp-client-email ${storageConfig.credentials.client_email} \
      --gcp-private-key ${storageConfig.credentials.private_key} \
      --restore-tool-options "--host ${postgresqlConfig.host} --username ${postgresqlConfig.user}" \
      ${objectURI}`;

    beforeEach(cleanTestGCSBucket);
    beforeEach(cleanTestPG);
    beforeEach(async() => {
      await uploadFixtureToTestGCSBucket('backup-20220402000000.tar.bz2'); // includes 'dummy' table
    });

    it('restore PostgreSQL in bucket', async() => {
      expect(await listTableNamesInTestPG()).toEqual([]);
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.js started at .* ===/),
        stderr: '',
      });
      expect(await listTableNamesInTestPG()).toEqual(['dummy']);
    });
  });
});

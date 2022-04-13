import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import {
  s3ClientConfig,
  testS3BucketURI,
  cleanTestS3Bucket,
  storageConfig,
  testGCSBucketURI,
  cleanTestGCSBucket,
  listFileNamesInTestGCSBucket,
} from '@awesome-backup/storage-service-test';
import {
  prepareTestPG,
  postgresqlConfig,
} from '@awesome-backup/postgresql-test';

const exec = promisify(execOriginal);

const execBackupCommand = 'yarn run ts-node src/bin/backup';

describe('backup', () => {
  describe('when option --help is specified', () => {
    const commandLine = `${execBackupCommand} --help`;
    it('show help messages', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('Usage:'),
        stderr: '',
      });
    });
  });

  describe('when no option is specified', () => {
    const commandLine = `${execBackupCommand}`;
    it('throw error message', async() => {
      await expect(exec(commandLine)).rejects.toThrowError(
        /missing required argument 'TARGET_BUCKET_URL'/,
      );
    });
  });

  describe('when valid S3 options are specified', () => {
    beforeEach(cleanTestS3Bucket);
    beforeEach(prepareTestPG);

    describe('and when backup tool options are specified', () => {
      const commandLine = `PGPASSWORD="password" \
        ${execBackupCommand} \
        --aws-endpoint-url ${s3ClientConfig.endpoint} \
        --aws-region ${s3ClientConfig.region} \
        --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
        --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
        --backup-tool-options "--host ${postgresqlConfig.host} --username ${postgresqlConfig.user} --port ${postgresqlConfig.port}" \
        ${testS3BucketURI}`;

      it('backup PostgreSQL in bucket', async() => {
        expect(await exec(commandLine)).toEqual({
          stdout: expect.stringMatching(/=== backup.js started at .* ===/),
          stderr: '',
        });
      });
    });
  });

  describe('when valid GCS options are specified', () => {
    beforeEach(cleanTestGCSBucket);
    beforeEach(prepareTestPG);

    describe('and when backup tool options are specified', () => {
      const commandLine = `PGPASSWORD="password" \
        ${execBackupCommand} \
        --gcp-endpoint-url ${storageConfig.apiEndpoint} \
        --gcp-project-id ${storageConfig.projectId} \
        --gcp-client-email ${storageConfig.credentials.client_email} \
        --gcp-private-key ${storageConfig.credentials.private_key} \
        --backup-tool-options "--host ${postgresqlConfig.host} --username ${postgresqlConfig.user} --port ${postgresqlConfig.port}" \
        ${testGCSBucketURI}/`;

      it('backup PostgreSQL in bucket', async() => {
        expect((await listFileNamesInTestGCSBucket()).length).toBe(0);
        expect(await exec(commandLine)).toEqual({
          stdout: expect.stringMatching(/=== backup.js started at .* ===/),
          stderr: '',
        });
        expect((await listFileNamesInTestGCSBucket()).length).toBe(1);
      });
    });
  });
});

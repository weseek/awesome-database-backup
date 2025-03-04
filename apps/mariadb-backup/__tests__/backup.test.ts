import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import {
  s3ClientConfig,
  testS3BucketURI,
  cleanTestS3Bucket,
  listFileNamesInTestS3Bucket,
  storageConfig,
  testGCSBucketURI,
  cleanTestGCSBucket,
  listFileNamesInTestGCSBucket,
} from '@awesome-database-backup/storage-service-test';
import {
  prepareTestMariaDB,
  mariadbConfig,
} from '@awesome-database-backup/mariadb-test';

const exec = promisify(execOriginal);

const execBackupCommand = 'yarn run ts-node src/backup';

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
        /required option '--target-bucket-url <TARGET_BUCKET_URL> \*\*MANDATORY\*\*' not specified/,
      );
    });
  });

  describe('when valid S3 options are specified', () => {
    beforeEach(cleanTestS3Bucket);
    beforeEach(prepareTestMariaDB);

    describe('and when backup tool options are specified', () => {
      const commandLine = `MYSQL_PWD="${mariadbConfig.password}" \
        ${execBackupCommand} \
        --aws-endpoint-url ${s3ClientConfig.endpoint} \
        --aws-region ${s3ClientConfig.region} \
        --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
        --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
        --backup-tool-options "--host ${mariadbConfig.host} --user ${mariadbConfig.user} --port ${mariadbConfig.port} --all-databases" \
        --target-bucket-url ${testS3BucketURI}`;

      it('backup mariadb in bucket', async() => {
        expect(await exec(commandLine)).toEqual({
          stdout: expect.stringMatching(/=== backup.ts started at .* ===/),
          stderr: '',
        });
      });
    });
  });

  describe('when valid S3 options with stream mode are specified', () => {
    beforeEach(cleanTestS3Bucket);
    beforeEach(prepareTestMariaDB);

    describe('and when backup tool options are specified', () => {
      const commandLine = `MYSQL_PWD="${mariadbConfig.password}" \
        ${execBackupCommand} \
        --aws-endpoint-url ${s3ClientConfig.endpoint} \
        --aws-region ${s3ClientConfig.region} \
        --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
        --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
        --backup-tool-options "--host ${mariadbConfig.host} --user ${mariadbConfig.user} --port ${mariadbConfig.port} --all-databases" \
        --use-stream \
        --target-bucket-url ${testS3BucketURI}`;

      it('backup mariadb in bucket using stream mode', async() => {
        expect((await listFileNamesInTestS3Bucket()).length).toBe(0);
        expect(await exec(commandLine)).toEqual({
          stdout: expect.stringMatching(/=== backup.ts started at .* \(stream mode\) ===/),
          stderr: '',
        });
        expect((await listFileNamesInTestS3Bucket()).length).toBe(1);
      });
    });
  });

  describe('when valid GCS options are specified', () => {
    beforeEach(cleanTestGCSBucket);
    beforeEach(prepareTestMariaDB);

    describe('and when backup tool options are specified', () => {
      const commandLine = `MYSQL_PWD="${mariadbConfig.password}" \
        ${execBackupCommand} \
        --gcp-endpoint-url ${storageConfig.apiEndpoint} \
        --gcp-project-id ${storageConfig.projectId} \
        --gcp-client-email ${storageConfig.credentials.client_email} \
        --gcp-private-key ${storageConfig.credentials.private_key} \
        --backup-tool-options "--host ${mariadbConfig.host} --user ${mariadbConfig.user} --port ${mariadbConfig.port} --all-databases" \
        --target-bucket-url ${testGCSBucketURI}/`;

      it('backup mariadb in bucket', async() => {
        expect((await listFileNamesInTestGCSBucket()).length).toBe(0);
        expect(await exec(commandLine)).toEqual({
          stdout: expect.stringMatching(/=== backup.ts started at .* ===/),
          stderr: '',
        });
        expect((await listFileNamesInTestGCSBucket()).length).toBe(1);
      });
    });
  });

  describe('when valid GCS options with stream mode are specified', () => {
    beforeEach(cleanTestGCSBucket);
    beforeEach(prepareTestMariaDB);

    describe('and when backup tool options are specified', () => {
      const commandLine = `MYSQL_PWD="${mariadbConfig.password}" \
        ${execBackupCommand} \
        --gcp-endpoint-url ${storageConfig.apiEndpoint} \
        --gcp-project-id ${storageConfig.projectId} \
        --gcp-client-email ${storageConfig.credentials.client_email} \
        --gcp-private-key ${storageConfig.credentials.private_key} \
        --backup-tool-options "--host ${mariadbConfig.host} --user ${mariadbConfig.user} --port ${mariadbConfig.port} --all-databases" \
        --use-stream \
        --target-bucket-url ${testGCSBucketURI}/`;

      it('backup mariadb in bucket using stream mode', async() => {
        expect((await listFileNamesInTestGCSBucket()).length).toBe(0);
        expect(await exec(commandLine)).toEqual({
          stdout: expect.stringMatching(/=== backup.ts started at .* \(stream mode\) ===/),
          stderr: '',
        });
        expect((await listFileNamesInTestGCSBucket()).length).toBe(1);
      });
    });
  });
});

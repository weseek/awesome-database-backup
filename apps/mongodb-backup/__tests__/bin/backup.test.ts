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
  prepareTestMongoDB,
  mongodbURI,
} from '@awesome-backup/mongodb-test';

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
    beforeEach(prepareTestMongoDB);

    describe('and when backup tool options are specified', () => {
      const commandLine = `${execBackupCommand} \
        --aws-endpoint-url ${s3ClientConfig.endpoint} \
        --aws-region ${s3ClientConfig.region} \
        --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
        --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
        --backup-tool-options "--uri ${mongodbURI}" \
        ${testS3BucketURI}`;

      it('backup mongo in bucket', async() => {
        expect(await exec(commandLine)).toEqual({
          stdout: expect.stringMatching(/=== backup.js started at .* ===/),
          stderr: '',
        });
      });
    });
  });

  describe('when valid GCS options are specified', () => {
    beforeEach(cleanTestGCSBucket);
    beforeEach(prepareTestMongoDB);

    describe('and when backup tool options are specified', () => {
      const commandLine = `${execBackupCommand} \
        --gcp-endpoint-url ${storageConfig.apiEndpoint} \
        --gcp-project-id ${storageConfig.projectId} \
        --gcp-client-email ${storageConfig.credentials.client_email} \
        --gcp-private-key ${storageConfig.credentials.private_key} \
        --backup-tool-options "--uri ${mongodbURI}" \
        ${testGCSBucketURI}/`;

      it('backup mongo in bucket', async() => {
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

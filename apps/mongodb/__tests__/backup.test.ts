import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import {
  testS3BucketURI,
  cleanTestS3Bucket,
} from './supports/s3rver';
import {
  testGCSBucketURI,
  cleanTestGCSBucket,
  listFileNamesInTestGCSBucket,
} from './supports/fake-gcs-server';
import { prepareTestMongoDB } from './supports/mongodb';

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
        --aws-endpoint-url http://s3.s3rver \
        --aws-region us-east-1 \
        --aws-access-key-id "S3RVER" \
        --aws-secret-access-key "S3RVER" \
        --backup-tool-options "--uri mongodb://root:password@mongo/dummy?authSource=admin" \
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
        --gcp-endpoint-url http://fake-gcs-server:4443 \
        --gcp-project-id valid_project_id \
        --gcp-client-email valid@example.com \
        --gcp-private-key valid_private_key \
        --backup-tool-options "--uri mongodb://root:password@mongo/dummy?authSource=admin" \
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

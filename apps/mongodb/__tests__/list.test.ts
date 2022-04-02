import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import {
  testS3BucketURI,
  cleanTestS3Bucket,
  uploadFixtureToTestS3Bucket,
} from './supports/s3rver';
import {
  testGCSBucketURI,
  cleanTestGCSBucket,
  uploadFixtureToTestGCSBucket,
} from './supports/fake-gcs-server';

const exec = promisify(execOriginal);

const execListCommand = 'yarn run ts-node src/bin/list';

describe('list', () => {
  describe('when option --help is specified', () => {
    const commandLine = `${execListCommand} --help`;
    it('show help messages', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('Usage:'),
        stderr: '',
      });
    });
  });

  describe('when no option is specified', () => {
    const commandLine = `${execListCommand}`;
    it('throw error message', async() => {
      await expect(exec(commandLine)).rejects.toThrowError(
        /missing required argument 'TARGET_BUCKET_URL'/,
      );
    });
  });

  describe('when valid S3 options are specified', () => {
    const commandLine = `${execListCommand} \
      --aws-endpoint-url http://s3.s3rver \
      --aws-region us-east-1 \
      --aws-access-key-id "S3RVER" \
      --aws-secret-access-key "S3RVER" \
      ${testS3BucketURI}/`;

    beforeEach(cleanTestS3Bucket);
    beforeEach(async() => {
      await uploadFixtureToTestS3Bucket('backup-20220327224212.tar.bz2');
    });

    it('list files in bucket', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('backup-20220327224212.tar.bz2'),
        stderr: '',
      });
    });
  });

  describe('when valid GCS options are specified', () => {
    const commandLine = `${execListCommand} \
      --gcp-endpoint-url http://fake-gcs-server:4443 \
      --gcp-project-id valid_project_id \
      --gcp-client-email valid@example.com \
      --gcp-private-key valid_private_key \
      ${testGCSBucketURI}/`;

    beforeEach(cleanTestGCSBucket);
    beforeEach(async() => {
      await uploadFixtureToTestGCSBucket('backup-20220327224212.tar.bz2');
    });

    it('list files in bucket', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('backup-20220327224212.tar.bz2'),
        stderr: '',
      });
    });
  });
});

import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import { format } from 'date-fns';
import {
  testS3BucketURI,
  cleanTestS3Bucket,
  uploadFixtureToTestS3Bucket,
  listFileNamesInTestS3Bucket,
} from '../../../mongodb/__tests__/supports/s3rver';
import {
  testGCSBucketURI,
  cleanTestGCSBucket,
  uploadFixtureToTestGCSBucket,
  listFileNamesInTestGCSBucket,
} from '../../../mongodb/__tests__/supports/fake-gcs-server';

const exec = promisify(execOriginal);

const execPruneCommand = 'yarn run ts-node src/bin/prune';

describe('prune', () => {
  describe('when option --help is specified', () => {
    const commandLine = `${execPruneCommand} --help`;
    it('show help messages', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('Usage:'),
        stderr: '',
      });
    });
  });

  describe('when no option is specified', () => {
    const commandLine = `${execPruneCommand}`;
    it('throw error message', async() => {
      await expect(exec(commandLine)).rejects.toThrowError(
        /missing required argument 'TARGET_BUCKET_URL'/,
      );
    });
  });

  describe('when valid S3 options are specified', () => {
    beforeEach(cleanTestS3Bucket);

    describe('and when prune options show pruning files everyday', () => {
      const commandLine = `${execPruneCommand} \
        --aws-endpoint-url http://s3.s3rver \
        --aws-region us-east-1 \
        --aws-access-key-id "S3RVER" \
        --aws-secret-access-key "S3RVER" \
        --delete-divide 1 \
        --delete-target-days-left 0 \
        ${testS3BucketURI}`;
      const backupFileName = `backup-${format(Date.now(), 'yyyyMMddHHmmss')}.tar.bz2`;

      beforeEach(async() => {
        await uploadFixtureToTestS3Bucket('backup-20220327224212.tar.bz2', backupFileName);
      });

      it("prune today's files in bucket", async() => {
        expect(await listFileNamesInTestS3Bucket()).toEqual([backupFileName]);
        expect(await exec(commandLine)).toEqual({
          stdout: expect.stringContaining('DELETED past backuped file on S3'),
          stderr: '',
        });
        expect(await listFileNamesInTestS3Bucket()).toEqual([]);
      });
    });
  });

  describe('when valid GCS options are specified', () => {
    beforeEach(cleanTestGCSBucket);

    describe('and when prune options show pruning files everyday', () => {
      const commandLine = `${execPruneCommand} \
        --gcp-endpoint-url http://fake-gcs-server:4443 \
        --gcp-project-id valid_project_id \
        --gcp-client-email valid@example.com \
        --gcp-private-key valid_private_key \
        --delete-divide 1 \
        --delete-target-days-left 0 \
        ${testGCSBucketURI}/`;
      const backupFileName = `backup-${format(Date.now(), 'yyyyMMddHHmmss')}.tar.bz2`;

      beforeEach(async() => {
        await uploadFixtureToTestGCSBucket('backup-20220327224212.tar.bz2', backupFileName);
      });

      it("prune today's files in bucket", async() => {
        expect(await listFileNamesInTestGCSBucket()).toEqual([backupFileName]);
        expect(await exec(commandLine)).toEqual({
          stdout: expect.stringContaining('DELETED past backuped file on GCS'),
          stderr: '',
        });
        expect(await listFileNamesInTestGCSBucket()).toEqual([]);
      });
    });
  });
});

import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import { format } from 'date-fns';
import { testS3BucketURI, cleanTestS3Bucket } from './supports/s3rver-cleaner';

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
      const awsCommand = '\
        AWS_ACCESS_KEY_ID="S3RVER" \
        AWS_SECRET_ACCESS_KEY="S3RVER" \
        aws \
        --endpoint-url http://s3.s3rver \
        --region us-east-1';
      const backupFile = `backup-${format(Date.now(), 'yyyyMMddHHmmss')}.tar.bz2`;

      beforeEach(async() => {
        await exec(`${awsCommand} s3 cp __tests__/fixtures/backup-20220327224212.tar.bz2 ${testS3BucketURI}/${backupFile}`);
      });

      it("prune today's files in bucket", async() => {
        expect(await exec(`${awsCommand} s3 ls ${testS3BucketURI}`)).toEqual({
          stdout: expect.stringContaining(backupFile),
          stderr: '',
        });
        expect(await exec(commandLine)).toEqual({
          stdout: expect.stringContaining('DELETED past backuped file on S3'),
          stderr: '',
        });
        expect(await exec(`${awsCommand} s3 ls ${testS3BucketURI}`)).toEqual({
          stdout: '',
          stderr: '',
        });
      });
    });
  });

  describe('when valid GCS options are specified', () => {
    // TODO
  });
});

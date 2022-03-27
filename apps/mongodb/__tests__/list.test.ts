import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';

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
    const bucketURI = 's3://test/';
    const commandLine = `${execListCommand} \
      --aws-endpoint-url http://s3.s3rver \
      --aws-region us-east-1 \
      --aws-access-key-id "S3RVER" \
      --aws-secret-access-key "S3RVER" \
      ${bucketURI}`;

    beforeEach(async() => {
      const awsCommand = '\
        AWS_ACCESS_KEY_ID="S3RVER" \
        AWS_SECRET_ACCESS_KEY="S3RVER" \
        aws \
        --endpoint-url http://s3.s3rver \
        --region us-east-1';
      await exec(`${awsCommand} s3 rb ${bucketURI} --force`);
      await exec(`${awsCommand} s3 mb ${bucketURI}`);
      await exec(`${awsCommand} s3 cp __tests__/fixtures/dummy-backup-20180622000000.tar.bz2 ${bucketURI}`);
    });

    it('list files in bucket', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('dummy-backup-20180622000000.tar.bz2'),
        stderr: '',
      });
    });
  });

  describe('when valid GCS options are specified', () => {
    // TODO
  });
});

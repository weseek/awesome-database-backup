import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execOriginal);
const execBackupCommand = 'yarn run ts-node src/bin/backup';
const tmp = require('tmp');

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
    const bucketURI = 's3://test/';
    const commandLine = `${execBackupCommand} \
      --aws-endpoint-url http://s3.s3rver \
      --aws-region us-east-1 \
      --aws-access-key-id "S3RVER" \
      --aws-secret-access-key "S3RVER" \
      --backup-tool-options "--uri mongodb://root:password@mongo/dummy?authSource=admin" \
      ${bucketURI}`;

    beforeEach(async() => {
      // prepare S3 bucket
      const awsCommand = '\
        AWS_ACCESS_KEY_ID="S3RVER" \
        AWS_SECRET_ACCESS_KEY="S3RVER" \
        aws \
        --endpoint-url http://s3.s3rver \
        --region us-east-1';
      await exec(`${awsCommand} s3 rb ${bucketURI} --force`);
      await exec(`${awsCommand} s3 mb ${bucketURI}`);

      // prepare mongoDB
      tmp.setGracefulCleanup();
      const tmpdir = tmp.dirSync({ unsafeCleanup: true });
      await exec(`tar jxf __tests__/fixtures/dummy-backup-20220327000000.tar.bz2 -C ${tmpdir.name}`);
      await exec(`mongorestore -h mongo -u root -p password --authenticationDatabase=admin --drop --dir ${tmpdir.name}`);
    });

    it('backup mongo in bucket', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== backup.js started at .* ===/),
        stderr: '',
      });
    });
  });

  describe('when valid GCS options are specified', () => {
    // TODO
  });
});

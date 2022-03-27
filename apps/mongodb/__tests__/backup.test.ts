import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import { testS3BucketURI, cleanTestS3Bucket } from './supports/s3rver-cleaner';

const exec = promisify(execOriginal);
const tmp = require('tmp');

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

    describe('and when backup tool options are specified', () => {
      const commandLine = `${execBackupCommand} \
        --aws-endpoint-url http://s3.s3rver \
        --aws-region us-east-1 \
        --aws-access-key-id "S3RVER" \
        --aws-secret-access-key "S3RVER" \
        --backup-tool-options "--uri mongodb://root:password@mongo/dummy?authSource=admin" \
        ${testS3BucketURI}`;

      beforeEach(async() => {
        // prepare mongoDB
        tmp.setGracefulCleanup();
        const tmpdir = tmp.dirSync({ unsafeCleanup: true });
        await exec(`tar jxf __tests__/fixtures/backup-20220327224212.tar.bz2 -C ${tmpdir.name}`);
        await exec(`mongorestore -h mongo -u root -p password --authenticationDatabase=admin --drop --dir ${tmpdir.name}`);
      });

      it('backup mongo in bucket', async() => {
        expect(await exec(commandLine)).toEqual({
          stdout: expect.stringMatching(/=== backup.js started at .* ===/),
          stderr: '',
        });
      });
    });
  });

  describe('when valid GCS options are specified', () => {
    // TODO
  });
});

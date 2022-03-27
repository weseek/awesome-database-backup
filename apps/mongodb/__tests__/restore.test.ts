import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execOriginal);
const execRestoreCommand = 'yarn run ts-node src/bin/restore';

describe('restore', () => {
  describe('when option --help is specified', () => {
    const commandLine = `${execRestoreCommand} --help`;
    it('show help messages', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('Usage:'),
        stderr: '',
      });
    });
  });

  describe('when no option is specified', () => {
    const commandLine = `${execRestoreCommand}`;
    it('throw error message', async() => {
      await expect(exec(commandLine)).rejects.toThrowError(
        /missing required argument 'TARGET_BUCKET_URL'/,
      );
    });
  });

  describe('when valid S3 options are specified', () => {
    const bucketURI = 's3://test/';
    const objectURI = `${bucketURI}backup-20220327224212.tar.bz2`;
    const commandLine = `${execRestoreCommand} \
      --aws-endpoint-url http://s3.s3rver \
      --aws-region us-east-1 \
      --aws-access-key-id "S3RVER" \
      --aws-secret-access-key "S3RVER" \
      --restore-tool-options "--uri mongodb://root:password@mongo/?authSource=admin" \
      ${objectURI}`;

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
      await exec(`${awsCommand} s3 cp __tests__/fixtures/backup-20220327224212.tar.bz2 ${bucketURI}`);

      // prepare mongoDB
      await exec('mongosh mongodb://root:password@mongo/dummy?authSource=admin --eval "db.dropDatabase()"');
    });

    it('restore mongo in bucket', async() => {
      expect(await exec('mongosh mongodb://root:password@mongo/dummy?authSource=admin --eval "db.getCollectionNames()" --quiet')).toEqual({
        stdout: expect.stringContaining('[]'),
        stderr: '',
      });
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.js started at .* ===/),
        stderr: '',
      });
      expect(await exec('mongosh mongodb://root:password@mongo/dummy?authSource=admin --eval "db.getCollectionNames()" --quiet')).toEqual({
        stdout: expect.stringContaining("'dummy'"),
        stderr: '',
      });
    });
  });

  describe('when valid GCS options are specified', () => {
    // TODO
  });
});

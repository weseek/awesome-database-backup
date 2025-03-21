import {
  describe, beforeEach, it, expect,
} from 'vitest';
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
  getTestDirPath,
  prepareLargeTestFile,
} from '@awesome-database-backup/file-test';

const exec = promisify(execOriginal);

const execBackupCommand = 'yarn run ts-node src/backup';

describe('backup', () => {
  describe('when valid S3 options are specified', () => {
    beforeEach(cleanTestS3Bucket);
    beforeEach(() => prepareLargeTestFile(1024));

    describe('and when backup tool options are specified', () => {
      const commandLine = `${execBackupCommand} \
        --aws-endpoint-url ${s3ClientConfig.endpoint} \
        --aws-region ${s3ClientConfig.region} \
        --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
        --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
        --backup-tool-options "-v ${getTestDirPath()}" \
        --target-bucket-url ${testS3BucketURI} \
        --save-with-tempfile`;

      it('backup files in bucket', async() => {
        expect(await exec(commandLine)).toEqual({
          stdout: expect.stringMatching(/=== backup.ts started at .* ===/),
          stderr: '',
        });
      });
    });
  });

  // describe('when valid S3 options with stream mode are specified', () => {
  //   beforeEach(cleanTestS3Bucket);
  //   beforeEach(prepareTestFile);

  //   describe('and when backup tool options are specified', () => {
  //     const commandLine = `${execBackupCommand} \
  //       --aws-endpoint-url ${s3ClientConfig.endpoint} \
  //       --aws-region ${s3ClientConfig.region} \
  //       --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
  //       --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
  //       --backup-tool-options "-v ${getTestDirPath()}" \
  //       --target-bucket-url ${testS3BucketURI}`;

  //     it('backup files in bucket using stream mode', async() => {
  //       expect((await listFileNamesInTestS3Bucket()).length).toBe(0);
  //       expect(await exec(commandLine)).toEqual({
  //         stdout: expect.stringMatching(/=== backup.ts started at .* \(stream mode\) ===/),
  //         stderr: '',
  //       });
  //       expect((await listFileNamesInTestS3Bucket()).length).toBe(1);
  //     });
  //   });
  // });
});

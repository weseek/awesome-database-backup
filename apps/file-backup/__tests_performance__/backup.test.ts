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
  initFakeGCSServer,
} from '@awesome-database-backup/storage-service-test';
import {
  getTestDirPath,
  prepareLargeTestFile,
} from '@awesome-database-backup/file-test';

const exec = promisify(execOriginal);

const execBackupCommand = 'yarn run ts-node src/backup';

describe('backup', () => {
  describe('when valid GCS options are specified', () => {
    beforeEach(initFakeGCSServer);
    beforeEach(cleanTestGCSBucket);
    beforeEach(() => {
      prepareLargeTestFile(256);
    });

    describe('and when backup tool options are specified', () => {
      const commandLine = `${execBackupCommand} \
        --gcp-endpoint-url ${storageConfig.apiEndpoint} \
        --gcp-project-id ${storageConfig.projectId} \
        --gcp-client-email ${storageConfig.credentials.client_email} \
        --gcp-private-key ${storageConfig.credentials.private_key} \
        --backup-tool-options "-v ${getTestDirPath()}" \
        --target-bucket-url ${testGCSBucketURI}/`;

      it('backup files in bucket', async() => {
        expect((await listFileNamesInTestGCSBucket()).length).toBe(0);
        expect(await exec(commandLine)).toContain({
          stdout: expect.stringMatching(/=== backup.ts started at .* ===/),
          stderr: '',
        });
        expect((await listFileNamesInTestGCSBucket()).length).toBe(1);
      });
    });
  });

  // describe('when valid GCS options with stream mode are specified', () => {
  //   beforeEach(cleanTestGCSBucket);
  //   beforeEach(prepareTestFile);

  //   describe('and when backup tool options are specified', () => {
  //     const commandLine = `${execBackupCommand} \
  //       --gcp-endpoint-url ${storageConfig.apiEndpoint} \
  //       --gcp-project-id ${storageConfig.projectId} \
  //       --gcp-client-email ${storageConfig.credentials.client_email} \
  //       --gcp-private-key ${storageConfig.credentials.private_key} \
  //       --backup-tool-options "-v ${getTestDirPath()}" \
  //       --target-bucket-url ${testGCSBucketURI}/`;

  //     it('backup files in bucket using stream mode', async() => {
  //       expect((await listFileNamesInTestGCSBucket()).length).toBe(0);
  //       expect(await exec(commandLine)).toEqual({
  //         stdout: expect.stringMatching(/=== backup.ts started at .* \(stream mode\) ===/),
  //         stderr: '',
  //       });
  //       expect((await listFileNamesInTestGCSBucket()).length).toBe(1);
  //     });
  //   });
  // });
});

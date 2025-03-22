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

describe('[backup][tempfile mode]', () => {
  beforeEach(initFakeGCSServer);
  beforeEach(cleanTestGCSBucket);
  beforeEach(() => {
    prepareLargeTestFile(256);
  });

  const commandLine = `${execBackupCommand} \
    --gcp-endpoint-url ${storageConfig.apiEndpoint} \
    --gcp-project-id ${storageConfig.projectId} \
    --gcp-client-email ${storageConfig.credentials.client_email} \
    --gcp-private-key ${storageConfig.credentials.private_key} \
    --backup-tool-options "-v ${getTestDirPath()}" \
    --target-bucket-url ${testGCSBucketURI}/ \
    --save-with-tempfile`;

  it('backup files in bucket', async() => {
    expect((await listFileNamesInTestGCSBucket()).length).toBe(0);
    expect(await exec(commandLine)).toEqual({
      stdout: expect.stringMatching(/=== backup.ts started at .* ===/),
      stderr: expect.anything(),
    });
    expect((await listFileNamesInTestGCSBucket()).length).toBe(1);
  });
});

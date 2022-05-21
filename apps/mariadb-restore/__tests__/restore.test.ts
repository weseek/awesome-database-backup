import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import {
  s3ClientConfig,
  testS3BucketURI,
  cleanTestS3Bucket,
  uploadMariaDBFixtureToTestS3Bucket,
  storageConfig,
  testGCSBucketURI,
  cleanTestGCSBucket,
  uploadMariaDBFixtureToTestGCSBucket,
} from '@awesome-backup/storage-service-test';
import {
  cleanTestMariaDB,
  listTableNamesInTestMariaDB,
  mariadbConfig,
  testMariaDBName,
} from '@awesome-backup/mariadb-test';

const exec = promisify(execOriginal);

const execRestoreCommand = 'yarn run ts-node src/restore';

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
        /required option '--target-bucket-url <TARGET_BUCKET_URL> \*\*MANDATORY\*\*' not specified/,
      );
    });
  });

  describe('when valid S3 options are specified', () => {
    const objectURI = `${testS3BucketURI}/${testMariaDBName}.tar.bz2`;
    const commandLine = `MYSQL_PWD="password" \
      ${execRestoreCommand} \
      --aws-endpoint-url ${s3ClientConfig.endpoint} \
      --aws-region ${s3ClientConfig.region} \
      --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
      --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
      --restore-tool-options "--host ${mariadbConfig.host} --user ${mariadbConfig.user} --port ${mariadbConfig.port}" \
      --target-bucket-url ${objectURI}`;

    beforeEach(cleanTestS3Bucket);
    beforeEach(cleanTestMariaDB);
    beforeEach(async() => {
      await uploadMariaDBFixtureToTestS3Bucket(testMariaDBName); // includes 'dummy' table
    });

    it('restore MariaDB in bucket', async() => {
      expect(await listTableNamesInTestMariaDB()).toEqual([]);
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.ts started at .* ===/),
        stderr: '',
      });
      expect(await listTableNamesInTestMariaDB()).toEqual(['dummy']);
    });
  });

  describe('when valid GCS options are specified', () => {
    const objectURI = `${testGCSBucketURI}/${testMariaDBName}.tar.bz2`;
    const commandLine = `MYSQL_PWD="password" \
      ${execRestoreCommand} \
      --gcp-endpoint-url ${storageConfig.apiEndpoint} \
      --gcp-project-id ${storageConfig.projectId} \
      --gcp-client-email ${storageConfig.credentials.client_email} \
      --gcp-private-key ${storageConfig.credentials.private_key} \
      --restore-tool-options "--host ${mariadbConfig.host} --user ${mariadbConfig.user} --port ${mariadbConfig.port}" \
      --target-bucket-url ${objectURI}`;
    beforeEach(cleanTestGCSBucket);
    beforeEach(cleanTestMariaDB);
    beforeEach(async() => {
      await uploadMariaDBFixtureToTestGCSBucket(testMariaDBName); // includes 'dummy' table
    });

    it('restore MariaDB in bucket', async() => {
      expect(await listTableNamesInTestMariaDB()).toEqual([]);
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.ts started at .* ===/),
        stderr: '',
      });
      expect(await listTableNamesInTestMariaDB()).toEqual(['dummy']);
    });
  });
});

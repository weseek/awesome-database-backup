import {
  vi, afterEach, describe, beforeEach, it, expect,
} from 'vitest';
import { ICommonCommandOption } from '@awesome-database-backup/commands';

afterEach(() => {
  vi.resetModules();
});

describe('storageServiceClientFactory()', () => {
  describe('when "StorageServiceClientType" is "S3"', () => {
    const storageProviderType = 'S3';

    describe('when valid S3 options are specified', () => {
      const options: ICommonCommandOption = {
        targetBucketUrl: new URL('s3://valid-bucket'),
        awsRegion: 'valid-region',
        awsAccessKeyId: 'valid-key-id',
        awsSecretAccessKey: 'valid-key',
      };

      it('return S3StorageServiceClient calss', async() => {
        const { storageServiceClientFactory } = await import('../src/factory');
        expect(storageServiceClientFactory(storageProviderType, options).constructor.name).toBe('S3StorageServiceClient');
      });
    });
  });

  describe('when "StorageServiceClientType" is "GCS"', () => {
    const storageProviderType = 'GCS';

    beforeEach(() => {
      vi.doMock('@google-cloud/storage');
    });

    describe('when valid GCS options are specified', () => {
      const options: ICommonCommandOption = {
        targetBucketUrl: new URL('gs://valid-bucket'),
        gcpProjectId: 'valid-project-id',
        gcpClientEmail: 'valid-mail@example.com',
        gcpPrivateKey: 'valid-key',
      };

      it('call generateS3ServiceClient', async() => {
        const { storageServiceClientFactory } = await import('../src/factory');
        expect(storageServiceClientFactory(storageProviderType, options).constructor.name).toBe('GCSStorageServiceClient');
      });
    });
  });
});

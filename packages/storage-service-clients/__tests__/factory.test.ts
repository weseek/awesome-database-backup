import { ICommonCommandOption } from '@awesome-database-backup/commands';

afterEach(() => {
  jest.resetModules();
  jest.dontMock('@aws-sdk/client-s3');
  jest.dontMock('@google-cloud/storage');
});

describe('storageServiceClientFactory()', () => {
  describe('when "StorageServiceClientType" is "S3"', () => {
    const storageProviderType = 'S3';

    beforeEach(() => {
      jest.dontMock('@aws-sdk/client-s3');
    });

    describe('when valid S3 options are specified', () => {
      const options: ICommonCommandOption = {
        targetBucketUrl: new URL('s3://valid-bucket'),
        awsRegion: 'valid-region',
        awsAccessKeyId: 'valid-key-id',
        awsSecretAccessKey: 'valid-key',
      };

      it('return S3StorageServiceClient calss', () => {
        const { storageServiceClientFactory } = require('../src/factory');
        expect(storageServiceClientFactory(storageProviderType, options).constructor.name).toBe('S3StorageServiceClient');
      });
    });
  });

  describe('when "StorageServiceClientType" is "GCS"', () => {
    const storageProviderType = 'GCS';

    beforeEach(() => {
      jest.doMock('@google-cloud/storage');
    });

    describe('when valid GCS options are specified', () => {
      const options: ICommonCommandOption = {
        targetBucketUrl: new URL('gs://valid-bucket'),
        gcpProjectId: 'valid-project-id',
        gcpClientEmail: 'valid-mail@example.com',
        gcpPrivateKey: 'valid-key',
      };

      it('call generateS3ServiceClient', () => {
        const { storageServiceClientFactory } = require('../src/factory');
        expect(storageServiceClientFactory(storageProviderType, options).constructor.name).toBe('GCSStorageServiceClient');
      });
    });
  });
});

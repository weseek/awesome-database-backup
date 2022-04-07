import { ICommonCLIOption } from '../../src/commands/common';

afterEach(() => {
  jest.resetModules();
  jest.dontMock('@aws-sdk/client-s3');
  jest.dontMock('@google-cloud/storage');
});

describe('generateStorageServiceClient()', () => {
  describe('when "StorageProviderType" is "S3"', () => {
    const storageProviderType = 'S3';

    beforeEach(() => {
      jest.dontMock('@aws-sdk/client-s3');
    });

    describe('when valid S3 options are specified', () => {
      const options: ICommonCLIOption = {
        awsRegion: 'valid-region',
        awsAccessKeyId: 'valid-key-id',
        awsSecretAccessKey: 'valid-key',
      };

      it('return S3StorageServiceClient calss', () => {
        const { generateStorageServiceClient } = require('../../src/factories/provider-factory');
        expect(generateStorageServiceClient(storageProviderType, options).constructor.name).toBe('S3StorageServiceClient');
      });
    });
  });

  describe('when "StorageProviderType" is "GCS"', () => {
    const storageProviderType = 'GCS';

    beforeEach(() => {
      jest.doMock('@google-cloud/storage');
    });

    describe('when valid GCS options are specified', () => {
      const options: ICommonCLIOption = {
        gcpProjectId: 'valid-project-id',
        gcpClientEmail: 'valid-mail@example.com',
        gcpPrivateKey: 'valid-key',
      };

      it('call generateS3ServiceClient', () => {
        const { generateStorageServiceClient } = require('../../src/factories/provider-factory');
        expect(generateStorageServiceClient(storageProviderType, options).constructor.name).toBe('GCSStorageServiceClient');
      });
    });
  });
});

import { ICommonCLIOption } from '../../src/commands/common';

afterEach(() => {
  jest.resetModules();
  jest.dontMock('../../src/factories/s3-storage-service-client-generator');
  jest.dontMock('../../src/factories/gcs-storage-service-client-generator');
});

describe('generateStorageServiceClient()', () => {
  describe('when "StorageProviderType" is "S3"', () => {
    const storageProviderType = 'S3';
    const mockGenerateS3ServiceClient = jest.fn().mockResolvedValue({});

    beforeEach(() => {
      jest.doMock('../../src/factories/s3-storage-service-client-generator', () => {
        const mock = jest.requireActual('../../src/factories/s3-storage-service-client-generator');
        mock.generateS3ServiceClient = mockGenerateS3ServiceClient;
        return mock;
      });
    });

    describe('when valid S3 options are specified', () => {
      const options: ICommonCLIOption = {
        awsRegion: 'valid-region',
        awsAccessKeyId: 'valid-key-id',
        awsSecretAccessKey: 'valid-key',
      };

      it('call generateS3ServiceClient', () => {
        const { generateStorageServiceClient } = require('../../src/factories/provider-factory');
        generateStorageServiceClient(storageProviderType, options);
        expect(mockGenerateS3ServiceClient).toBeCalled();
      });
    });
  });

  describe('when "StorageProviderType" is "GCS"', () => {
    const storageProviderType = 'GCS';
    const mockGenerateGCSServiceClient = jest.fn().mockResolvedValue({});

    beforeEach(() => {
      jest.doMock('../../src/factories/gcs-storage-service-client-generator', () => {
        const mock = jest.requireActual('../../src/factories/gcs-storage-service-client-generator');
        mock.generateGCSServiceClient = mockGenerateGCSServiceClient;
        return mock;
      });
    });

    describe('when valid GCS options are specified', () => {
      const options: ICommonCLIOption = {
        gcpProjectId: 'valid-project-id',
        gcpClientEmail: 'valid-mail@example.com',
        gcpPrivateKey: 'valid-key',
      };

      it('call generateS3ServiceClient', () => {
        const { generateStorageServiceClient } = require('../../src/factories/provider-factory');
        generateStorageServiceClient(storageProviderType, options);
        expect(mockGenerateGCSServiceClient).toBeCalled();
      });
    });
  });
});

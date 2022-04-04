afterEach(() => {
  jest.resetModules();
  jest.dontMock('../../src/factories/s3-storage-service-client-config');
});

describe('generateS3ServiceClient()', () => {
  describe('when config file exists', () => {
    beforeEach(() => {
      jest.doMock('../../src/factories/s3-storage-service-client-config', () => {
        const mock = jest.requireActual('../../src/factories/s3-storage-service-client-config');
        mock.configExistS3 = jest.fn().mockReturnValue(true);
        return mock;
      });
    });

    it('return instance of S3ServiceClient', () => {
      const { generateS3ServiceClient } = require('../../src/factories/s3-storage-service-client-generator');
      expect(generateS3ServiceClient({}).constructor.name).toBe('S3ServiceClient');
    });
  });

  describe('when config file does not exists', () => {
    beforeEach(() => {
      jest.doMock('../../src/factories/s3-storage-service-client-config', () => {
        const mock = jest.requireActual('../../src/factories/s3-storage-service-client-config');
        mock.configExistS3 = jest.fn().mockReturnValue(false);
        return mock;
      });
    });

    describe('in case of required options are specified', () => {
      const options = {
        awsRegion: 'region',
        awsAccessKeyId: 'accessKeyId',
        awsSecretAccessKey: 'secretAccessKey',
      };

      it('return instance of S3ServiceClient', () => {
        const { generateS3ServiceClient } = require('../../src/factories/s3-storage-service-client-generator');
        expect(generateS3ServiceClient(options).constructor.name).toBe('S3ServiceClient');
      });
    });

    describe('in case of required options are not specified', () => {
      const options = {};

      it('throw error', () => {
        const { generateS3ServiceClient } = require('../../src/factories/s3-storage-service-client-generator');
        expect(() => { generateS3ServiceClient(options) }).toThrowError();
      });
    });
  });
});

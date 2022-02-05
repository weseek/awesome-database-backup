let providerFactory = require('../../src/factories/provider-factory');

afterEach(() => {
  jest.resetModules();
  jest.dontMock('../../src/factories/provider-factory');
  jest.dontMock('../../src/factories/provider-config-factory');
});

describe('storageProviderType()', () => {
  describe('in case of URL startWith "s3"', () => {
    const url = new URL('s3://bucket-name/object-name');
    it('return S3', () => {
      expect(providerFactory.storageProviderType(url)).toBe('S3');
    });
  });

  describe('in case of URL startWith "gcs"', () => {
    const url = new URL('gs://bucket-name/object-name');
    it('return GCS', () => {
      expect(providerFactory.storageProviderType(url)).toBe('GCS');
    });
  });
});

describe('generateS3ServiceClient()', () => {
  describe('when config file exists', () => {
    beforeEach(() => {
      jest.doMock('../../src/factories/provider-config-factory', () => {
        const mock = jest.requireActual('../../src/factories/provider-config-factory');
        mock.configExistS3 = jest.fn().mockReturnValue(true);
        return mock;
      });
      providerFactory = require('../../src/factories/provider-factory');
    });

    it('return instance of S3ServiceClient', () => {
      expect(providerFactory.generateS3ServiceClient({}).constructor.name).toBe('S3ServiceClient');
    });
  });

  describe('when config file does not exists', () => {
    const createConfigS3Mock = jest.fn();

    beforeEach(() => {
      jest.doMock('../../src/factories/provider-config-factory', () => {
        const mock = jest.requireActual('../../src/factories/provider-config-factory');
        mock.configExistS3 = jest.fn().mockReturnValue(false);
        mock.createConfigS3 = jest.fn().mockImplementation(createConfigS3Mock);
        return mock;
      });
      providerFactory = require('../../src/factories/provider-factory');
    });

    describe('in case of required options are specified', () => {
      const options = {
        awsRegion: 'region',
        awsAccessKeyId: 'accessKeyId',
        awsSecretAccessKey: 'secretAccessKey',
      };

      it('return instance of S3ServiceClient, and call "createConfigS3" method', () => {
        expect(providerFactory.generateS3ServiceClient(options).constructor.name).toBe('S3ServiceClient');
        expect(createConfigS3Mock).toHaveBeenCalled();
      });
    });

    describe('in case of required options are not specified', () => {
      const options = {};

      it('throw error', () => {
        expect(() => { providerFactory.generateS3ServiceClient(options) }).toThrowError();
      });
    });
  });
});

describe('generateGCSServiceClient()', () => {
  describe('in case of "gcpServiceAccountKeyJsonPath" is specified', () => {
    const options = {
      gcpServiceAccountKeyJsonPath: '/path/to/file',
    };

    it('return instance of GCSServiceClient', () => {
      expect(providerFactory.generateGCSServiceClient(options).constructor.name).toBe('GCSServiceClient');
    });
  });

  describe('in case of "gcpServiceAccountKeyJsonPath" is not specified, and "projectId", "clientEmail", "privateKey" are specified', () => {
    const options = {
      gcpServiceAccountKeyJsonPath: undefined,
      gcpProjectId: 'projectId',
      gcpClientEmail: 'clientEmail',
      gcpPrivateKey: 'privateKey',
    };

    it('return instance of GCSServiceClient', () => {
      expect(providerFactory.generateGCSServiceClient(options).constructor.name).toBe('GCSServiceClient');
    });
  });

  describe('in case of required options are specified', () => {
    const options = {
      gcpServiceAccountKeyJsonPath: undefined,
      gcpProjectId: undefined,
      gcpClientEmail: undefined,
      gcpPrivateKey: undefined,
    };

    it('throw error', () => {
      expect(() => { providerFactory.generateGCSServiceClient(options) }).toThrowError();
    });
  });
});

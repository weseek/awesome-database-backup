let providerFactory = require('../../src/factories/provider-factory');

describe('storageProviderType()', () => {
  describe('in case of URL startWith "s3"', () => {
    const url = new URL('s3://bucket-name/object-name');
    test('it return S3', () => {
      expect(providerFactory.storageProviderType(url)).toBe('S3');
    });
  });

  describe('in case of URL startWith "gcs"', () => {
    const url = new URL('gs://bucket-name/object-name');
    test('it return GCS', () => {
      expect(providerFactory.storageProviderType(url)).toBe('GCS');
    });
  });
});

describe('generateS3ServiceClient()', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.dontMock('../../src/factories/provider-factory');
    providerFactory = require('../../src/factories/provider-factory');
  });

  describe('when config file exists', () => {
    beforeEach(() => {
      const providerConfigFactory = require('../../src/factories/provider-config-factory');
      jest.spyOn(providerConfigFactory, 'configExistS3').mockReturnValue(true);
    });

    test("it return S3ServiceClient's instance", () => {
      expect(providerFactory.generateS3ServiceClient({}).constructor.name).toBe('S3ServiceClient');
    });
  });

  describe('when config file does not exists', () => {
    beforeEach(() => {
      const providerConfigFactory = require('../../src/factories/provider-config-factory');
      jest.spyOn(providerConfigFactory, 'configExistS3').mockReturnValue(false);
    });

    describe('in case of required options are specified', () => {
      test('it throw error', () => {
        const providerConfigFactory = require('../../src/factories/provider-config-factory');
        const spy = jest.spyOn(providerConfigFactory, 'createConfigS3');
        const options = {
          awsRegion: 'region',
          awsAccessKeyId: 'accessKeyId',
          awsSecretAccessKey: 'secretAccessKey',
        };

        expect(providerFactory.generateS3ServiceClient(options).constructor.name).toBe('S3ServiceClient');
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('in case of required options are not specified', () => {
      test('it throw error', () => {
        expect(() => { providerFactory.generateS3ServiceClient({}) }).toThrowError();
      });
    });
  });
});

describe('generateGCSServiceClient()', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.dontMock('../../src/factories/provider-factory');
    providerFactory = require('../../src/factories/provider-factory');
  });

  describe('in case of "gcpServiceAccountKeyJsonPath" is specified', () => {
    test("it return GCSServiceClient's instance", () => {
      const options = {
        gcpServiceAccountKeyJsonPath: '/path/to/file',
      };
      expect(providerFactory.generateGCSServiceClient(options).constructor.name).toBe('GCSServiceClient');
    });
  });

  describe('in case of "gcpServiceAccountKeyJsonPath" is not specified, and "projectId", "clientEmail", "privateKey" are specified', () => {
    test("it return GCSServiceClient's instance", () => {
      const options = {
        gcpServiceAccountKeyJsonPath: null,
        gcpProjectId: 'projectId',
        gcpClientEmail: 'clientEmail',
        gcpPrivateKey: 'privateKey',
      };
      expect(providerFactory.generateGCSServiceClient(options).constructor.name).toBe('GCSServiceClient');
    });
  });

  describe('in case of required options are specified', () => {
    test("it return GCSServiceClient's instance", () => {
      const options = {
        gcpServiceAccountKeyJsonPath: null,
        gcpProjectId: null,
        gcpClientEmail: null,
        gcpPrivateKey: null,
      };
      expect(() => { providerFactory.generateGCSServiceClient(options) }).toThrowError();
    });
  });
});

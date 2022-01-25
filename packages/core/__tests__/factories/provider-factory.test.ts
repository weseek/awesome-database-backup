let providerFactory = require('../../src/factories/provider-factory');

describe('getStorageProviderType()', () => {
  describe('in case of URL startWith "s3"', () => {
    const url = new URL('s3://bucket-name/object-name');
    test('it return S3', () => {
      expect(providerFactory.getStorageProviderType(url)).toBe('S3');
    });
  });

  describe('in case of URL startWith "gcs"', () => {
    const url = new URL('gs://bucket-name/object-name');
    test('it return GCS', () => {
      expect(providerFactory.getStorageProviderType(url)).toBe('GCS');
    });
  });
});

describe('generateS3Provider()', () => {
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

    test("it return S3Provider's instance", () => {
      expect(providerFactory.generateS3Provider({}).constructor.name).toBe('S3Provider');
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

        expect(providerFactory.generateS3Provider(options).constructor.name).toBe('S3Provider');
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('in case of required options are not specified', () => {
      test('it throw error', () => {
        expect(() => { providerFactory.generateS3Provider({}) }).toThrowError();
      });
    });
  });
});

describe('generateGCSClient()', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.dontMock('../../src/factories/provider-factory');
    providerFactory = require('../../src/factories/provider-factory');
  });

  describe('in case of "gcpServiceAccountKeyJsonPath" is specified', () => {
    test("it return GCSClient's instance", () => {
      const options = {
        gcpServiceAccountKeyJsonPath: '/path/to/file',
      };
      expect(providerFactory.generateGCSClient(options).constructor.name).toBe('GCSClient');
    });
  });

  describe('in case of "gcpServiceAccountKeyJsonPath" is not specified, and "projectId", "clientEmail", "privateKey" are specified', () => {
    test("it return GCSClient's instance", () => {
      const options = {
        gcpServiceAccountKeyJsonPath: null,
        gcpProjectId: 'projectId',
        gcpClientEmail: 'clientEmail',
        gcpPrivateKey: 'privateKey',
      };
      expect(providerFactory.generateGCSClient(options).constructor.name).toBe('GCSClient');
    });
  });

  describe('in case of required options are specified', () => {
    test("it return GCSClient's instance", () => {
      const options = {
        gcpServiceAccountKeyJsonPath: null,
        gcpProjectId: null,
        gcpClientEmail: null,
        gcpPrivateKey: null,
      };
      expect(() => { providerFactory.generateGCSClient(options) }).toThrowError();
    });
  });
});

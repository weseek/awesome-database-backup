const rewire = require('rewire');

let providerConfigFactory = rewire('../../src/factories/provider-config-factory');

describe('configExistS3', () => {
  describe('in case of config file exists', () => {
    beforeEach(() => {
      providerConfigFactory.__set__(
        'configPathsS3',
        jest.fn().mockReturnValue({
          configurationPath: '/path/to/config',
          credentialPath: '/path/to/credential',
        }),
      );
      providerConfigFactory.__set__(
        'fileExists',
        jest.fn().mockReturnValue(true),
      );
    });

    test('it return true', () => {
      expect(providerConfigFactory.configExistS3()).toBe(true);
    });
  });

  describe("in case of config file dosn't exists", () => {
    test('it return false', () => {
      providerConfigFactory.__set__(
        'configPathsS3',
        jest.fn().mockReturnValue({
          configurationPath: '/path/to/config',
          credentialPath: '/path/to/credential',
        }),
      );
      providerConfigFactory.__set__(
        'fileExists',
        jest.fn().mockReturnValue(false),
      );

      expect(providerConfigFactory.configExistS3()).toBe(false);
    });
  });
});

describe('unlinkConfigS3', () => {
  describe('in case of config file exists', () => {
    beforeEach(() => {
      providerConfigFactory.__set__(
        'configPathsS3',
        jest.fn().mockReturnValue({
          configurationPath: '/path/to/config',
          credentialPath: '/path/to/credential',
        }),
      );
      providerConfigFactory.__set__(
        'fileExists',
        jest.fn().mockReturnValue(true),
      );
    });

    test('it return undefined, and call "unlinkSync" method', () => {
      const fs = require('fs');
      const unlinkSyncMock = jest.spyOn(fs, 'unlinkSync');
      providerConfigFactory = rewire('../../src/factories/provider-config-factory');
      expect(providerConfigFactory.unlinkConfigS3()).toBe(undefined);
      expect(unlinkSyncMock).toBeCalled();
    });
  });
});

describe('createConfigS3', () => {
  describe('in case of required options are specified', () => {
    const configPathObject = {
      configurationPath: '/path/to/config',
      credentialPath: '/path/to/credential',
    };

    test('it return object which have "configurationPath" and "credentialPath", and call "writeFileSync" method with config data from option', () => {
      const options = {
        awsRegion: 'region',
        awsAccessKeyId: 'accessKeyId',
        awsSecretAccessKey: 'secretAccessKey',
      };
      const fs = require('fs');
      const writeFileSyncMock = jest.spyOn(fs, 'writeFileSync').mockReturnValue(undefined);
      providerConfigFactory = rewire('../../src/factories/provider-config-factory');
      providerConfigFactory.__set__(
        'configPathsS3',
        jest.fn().mockReturnValue(configPathObject),
      );

      expect(providerConfigFactory.createConfigS3(options)).toEqual(configPathObject);
      expect(writeFileSyncMock).toHaveBeenNthCalledWith(
        1,
        configPathObject.configurationPath,
        expect.stringContaining(options.awsRegion),
      );
      expect(writeFileSyncMock).toHaveBeenNthCalledWith(
        2,
        configPathObject.credentialPath,
        expect.stringContaining(options.awsAccessKeyId),
      );
      expect(writeFileSyncMock).toHaveBeenNthCalledWith(
        2,
        configPathObject.credentialPath,
        expect.stringContaining(options.awsSecretAccessKey),
      );
    });
  });
});

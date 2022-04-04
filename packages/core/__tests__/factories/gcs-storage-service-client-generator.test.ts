import { generateGCSServiceClient } from '../../src/factories/gcs-storage-service-client-generator';

describe('generateGCSServiceClient()', () => {
  describe('in case of "gcpServiceAccountKeyJsonPath" is specified', () => {
    const options = {
      gcpServiceAccountKeyJsonPath: '/path/to/file',
    };

    it('return instance of GCSServiceClient', () => {
      expect(generateGCSServiceClient(options).constructor.name).toBe('GCSServiceClient');
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
      expect(generateGCSServiceClient(options).constructor.name).toBe('GCSServiceClient');
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
      expect(() => { generateGCSServiceClient(options) }).toThrowError();
    });
  });
});

import { getStorageProviderType } from '../../src/storage-service-clients/types';

describe('getStorageProviderType()', () => {
  describe('in case of URL startWith "s3"', () => {
    const url = new URL('s3://bucket-name/object-name');
    it('return S3', () => {
      expect(getStorageProviderType(url)).toBe('S3');
    });
  });

  describe('in case of URL startWith "gcs"', () => {
    const url = new URL('gs://bucket-name/object-name');
    it('return GCS', () => {
      expect(getStorageProviderType(url)).toBe('GCS');
    });
  });
});

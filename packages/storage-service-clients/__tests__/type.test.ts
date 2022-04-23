import { getStorageServiceClientType } from '../src/types';

describe('getStorageServiceClientType()', () => {
  describe('in case of URL startWith "s3"', () => {
    const url = new URL('s3://bucket-name/object-name');
    it('return S3', () => {
      expect(getStorageServiceClientType(url)).toBe('S3');
    });
  });

  describe('in case of URL startWith "gcs"', () => {
    const url = new URL('gs://bucket-name/object-name');
    it('return GCS', () => {
      expect(getStorageServiceClientType(url)).toBe('GCS');
    });
  });
});

import { getProviderType } from '../../src/factories/provider-factory';

describe('getProviderType()', () => {
  describe('in case of URL startWith "s3"', () => {
    const url = new URL('s3://bucket-name/object-name');
    test('it return S3', () => {
      expect(getProviderType(url)).toBe('S3');
    });
  });

  describe('in case of URL startWith "gcs"', () => {
    const url = new URL('gs://bucket-name/object-name');
    test('it return GCS', () => {
      expect(getProviderType(url)).toBe('GCS');
    });
  });
});

import { generateProvider } from '@awesome-backup/core';

describe('generateProvider()', () => {
  describe('in case of URL startWith "s3"', () => {
    const url = 's3://bucket-name/object-name';
    test('it return S3Provider', () => {
      expect(generateProvider(url).constructor.name).toBe('S3Provider');
    });
  });
});

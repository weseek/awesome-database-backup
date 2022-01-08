import { IProvider } from '@awesome-backup/core/interfaces/provider';
import { S3Provider } from '@awesome-backup/core/providers/s3';
import { GCSProvider } from '@awesome-backup/core/providers/gcs';
import { S3ClientConfig } from '@aws-sdk/client-s3';

export function generateProvider(url: URL, config: S3ClientConfig|null = null): IProvider {
  switch (url.protocol) {
    case 's3:':
      return new S3Provider(config || {});
    case 'gcs:':
      return new GCSProvider(config || {});
  }
  throw new Error('URL scheme must be \'s3\' or \'gcs\'.');
}

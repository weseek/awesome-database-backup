import { IProvider } from '@awesome-backup/core/interfaces/provider';
import { S3Provider } from '@awesome-backup/core/providers/s3';
import { GCSProvider } from '@awesome-backup/core/providers/gcs';

export function generateProvider(url: string): IProvider {
  const urlObj = new URL(url);
  switch (urlObj.protocol) {
    case 's3:':
      return new S3Provider({});
    case 'gcs:':
      return new GCSProvider();
  }
  throw new Error('URL scheme must be \'s3\' or \'gcs\'.');
}

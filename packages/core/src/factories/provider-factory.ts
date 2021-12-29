import { IProvider } from '../interfaces/provider'
import { S3Provider } from '../providers/s3'
import { GCSProvider } from '../providers/gcs'

export function generateProvider(url: string): IProvider {
  const urlObj = new URL(url);
  switch (urlObj.protocol) {
    case 's3:':
      return new S3Provider({});
    case 'gcs:':
      return new GCSProvider();
  }
  throw new Error(`URL scheme must be 's3' or 'gcs'.`);
}

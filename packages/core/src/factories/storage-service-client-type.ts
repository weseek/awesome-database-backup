import { StorageProviderType } from '../interfaces/storage-service-client';

export function storageProviderType(target: URL): StorageProviderType|undefined {
  const typeMap: Record<string, StorageProviderType> = {
    s3: 'S3',
    gs: 'GCS',
  };
  const key = target.protocol.replace(/:/, '');
  return typeMap[key];
}

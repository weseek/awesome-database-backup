export type StorageServiceClientType = 'S3' | 'GCS';

export function getStorageServiceClientType(target: URL): StorageServiceClientType|undefined {
  const typeMap: Record<string, StorageServiceClientType> = {
    s3: 'S3',
    gs: 'GCS',
  };
  const key = target.protocol.replace(/:/, '');
  return typeMap[key];
}

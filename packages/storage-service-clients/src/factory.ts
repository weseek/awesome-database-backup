import { S3StorageServiceClient } from './s3';
import { GCSStorageServiceClient } from './gcs';
import {
  IStorageServiceClient,
  S3StorageServiceClientConfig,
  GCSStorageServiceClientConfig,
} from './interfaces';
import { StorageServiceClientType } from './types';

export function storageServiceClientFactory(
    type: StorageServiceClientType,
    options: S3StorageServiceClientConfig | GCSStorageServiceClientConfig,
): IStorageServiceClient {
  const factoryMap: { type: StorageServiceClientType, factory: any }[] = [
    { type: 'S3', factory: (options: S3StorageServiceClientConfig) => new S3StorageServiceClient(options) },
    { type: 'GCS', factory: (options: GCSStorageServiceClientConfig) => new GCSStorageServiceClient(options) },
  ];
  const generator = factoryMap.find(it => it.type === type);
  if (generator == null) throw new Error(`Unknown factory for type ${type}`);

  return generator.factory(options);
}

export default storageServiceClientFactory;

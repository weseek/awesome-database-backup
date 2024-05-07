import { S3StorageServiceClient } from './s3';
import { GCSStorageServiceClient } from './gcs';
import {
  IStorageServiceClient,
} from './interfaces';
import { StorageServiceClientType } from './types';

export function storageServiceClientFactory(
    type: StorageServiceClientType,
): IStorageServiceClient {
  const factoryMap: { type: StorageServiceClientType, factory: () => IStorageServiceClient }[] = [
    { type: 'S3', factory: () => new S3StorageServiceClient() },
    { type: 'GCS', factory: () => new GCSStorageServiceClient() },
  ];
  const generator = factoryMap.find(it => it.type === type);
  if (generator == null) throw new Error(`Unknown factory for type ${type}`);

  return generator.factory();
}

export default storageServiceClientFactory;

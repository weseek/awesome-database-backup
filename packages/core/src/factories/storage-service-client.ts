import { S3StorageServiceClient } from '../storage-service-clients/s3';
import { GCSStorageServiceClient } from '../storage-service-clients/gcs';
import { IStorageServiceClient } from '../interfaces/storage-service-client';
import { StorageServiceClientType } from '../storage-service-clients/types';
import { ICommonCLIOption } from '../commands/common';

export function storageServiceClientFactory(type: StorageServiceClientType, options: ICommonCLIOption): IStorageServiceClient {
  const factoryMap: { type: StorageServiceClientType, factory: any }[] = [
    { type: 'S3', factory: (options: ICommonCLIOption) => new S3StorageServiceClient(options) },
    { type: 'GCS', factory: (options: ICommonCLIOption) => new GCSStorageServiceClient(options) },
  ];
  const generator = factoryMap.find(it => it.type === type);
  if (generator == null) throw new Error(`Unknown factory for type ${type}`);

  return generator.factory(options);
}

export default storageServiceClientFactory;

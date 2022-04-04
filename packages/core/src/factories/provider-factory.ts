import { generateS3ServiceClient } from './s3-storage-service-client-generator';
import { generateGCSServiceClient } from './gcs-storage-service-client-generator';
import { StorageProviderType, IStorageServiceClient } from '../interfaces/storage-service-client';
import { ICommonCLIOption } from '../commands/common';

export function generateStorageServiceClient(type: StorageProviderType, options: ICommonCLIOption): IStorageServiceClient {
  const factoryMap: { type: StorageProviderType, factory: any }[] = [
    { type: 'S3', factory: generateS3ServiceClient },
    { type: 'GCS', factory: generateGCSServiceClient },
  ];
  const generator = factoryMap.find(it => it.type === type);
  if (generator == null) throw new Error(`Unknown factory for type ${type}`);

  return generator.factory(options);
}

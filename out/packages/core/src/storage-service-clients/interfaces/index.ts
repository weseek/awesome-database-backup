import { listS3FilesOptions } from './method-options/s3';
import { listGCSFilesOptions } from './method-options/gcs';

export interface IStorageServiceClient {
  name: string,

  exists(url: string): Promise<boolean>,
  listFiles(url: string, optionsRequired?: listS3FilesOptions | listGCSFilesOptions): Promise<string[]>,
  deleteFile(url: string): Promise<void>,
  copyFile(copySource: string, copyDestination: string): Promise<void>,
}

export * from './config/gcs';
export * from './config/s3';
export * from './method-options/gcs';
export * from './method-options/s3';
export * from './uri/gcs';
export * from './uri/s3';

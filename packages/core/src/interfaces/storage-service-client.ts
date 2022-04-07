export declare interface listS3FilesOptions {
  includeFolderInList?: boolean,
  absolutePath?: boolean,
  exactMatch?: boolean,
}

export declare interface listGCSFilesOptions {
  exactMatch?: boolean,
}

export interface IStorageServiceClient {
  name: string,

  exists(url: string): Promise<boolean>,
  listFiles(url: string, optionsRequired?: listS3FilesOptions | listGCSFilesOptions): Promise<string[]>,
  deleteFile(url: string): Promise<void>,
  copyFile(copySource: string, copyDestination: string): Promise<void>,
}

import { Storage, StorageOptions, File } from '@google-cloud/storage';
import { join, basename } from 'path';
import { IStorageServiceClient } from '../interfaces/storage-service-client';

export declare interface GCSURI {
  bucket: string,
  filepath: string
}

/**
 * Parse GCS's URI(start with "gs:")
 * If it is not GCS's URL, return null.
 */
function _parseFilePath(path: string): GCSURI | null {
  /* GCS URI */
  if (path.startsWith('gs:')) {
    // https://regex101.com/r/vDGuGY/1
    const regexGCSUri = /^gs:\/\/([^/]+)\/?(.*)$/;
    try {
      const match = path.match(regexGCSUri);
      if (!match) return null;
      const [, bucket, filepath] = match;
      return { bucket, filepath };
    }
    catch (e) {
      return null;
    }
  }
  return null;
}

export class GCSServiceClient implements IStorageServiceClient {

  name: string;

  client: Storage;

  constructor(config: StorageOptions) {
    this.name = 'GCS';
    this.client = new Storage(config);
  }

  exists(url: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.listFiles(url)
        .then((lists) => {
          resolve(lists.length > 0);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  listFiles(url: string): Promise<string[]> {
    const gcsUrl = _parseFilePath(url);
    if (gcsUrl == null) return Promise.reject(new Error(`URI ${url} is not correct GCS's`));

    return new Promise((resolve, reject) => {
      const targetBucket = this.client.bucket(gcsUrl.bucket);
      targetBucket.getFiles()
        .then(([files]: File[][]) => {
          if (files == null) return reject(new Error('Bucket#getFiles return null'));

          const filepaths = files.map(file => file.name);
          resolve(filepaths);
        })
        .catch(e => reject(e));
    });
  }

  deleteFile(url: string): Promise<void> {
    const gcsUrl = _parseFilePath(url);
    if (gcsUrl == null) return Promise.reject(new Error(`URI ${url} is not correct GCS's`));

    return new Promise((resolve, reject) => {
      const deleteTargetFile = this.client.bucket(gcsUrl.bucket).file(gcsUrl.filepath);
      deleteTargetFile.delete()
        .then(() => resolve())
        .catch(e => reject(e));
    });
  }

  copyFile(copySource: string, copyDestination: string): Promise<void> {
    const parseSourceResult = _parseFilePath(copySource);
    const parseDestinationResult = _parseFilePath(copyDestination);

    /* Upload local file to GCS */
    if (parseSourceResult == null && parseDestinationResult != null) {
      const destinationGCSUri = parseDestinationResult as GCSURI;
      return this.uploadFile(copySource, destinationGCSUri);
    }
    /* Download GCS object and save as local file */
    if (parseSourceResult != null && parseDestinationResult == null) {
      const sourceGCSUri = parseSourceResult as GCSURI;
      return this.downloadFile(sourceGCSUri, copyDestination);
    }
    /* Copy GCS object and save as another GCS object */
    if (parseSourceResult != null && parseDestinationResult != null) {
      const sourceGCSUri = parseSourceResult as GCSURI;
      const destinationGCSUri = parseDestinationResult as GCSURI;
      return this.copyFileOnRemote(sourceGCSUri, destinationGCSUri);
    }

    return Promise.reject(new Error('At least the copy source or destination must be an GCS endpoint.'));
  }

  uploadFile(sourceFilePath: string, destinationGCSUri: GCSURI): Promise<void> {
    return new Promise((resolve, reject) => {
      const destinationFilePath = (destinationGCSUri.filepath === '' || destinationGCSUri.filepath.endsWith('/'))
        ? basename(sourceFilePath)
        : destinationGCSUri.filepath;
      const destinationBucket = this.client.bucket(destinationGCSUri.bucket);
      destinationBucket.upload(sourceFilePath, { destination: destinationFilePath })
        .then(() => resolve())
        .catch(e => reject(e));
    });
  }

  downloadFile(sourceGCSUri: GCSURI, destinationFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sourceFile = this.client.bucket(sourceGCSUri.bucket).file(sourceGCSUri.filepath);
      const options = {
        destination: destinationFilePath,
      };
      sourceFile.download(options)
        .then(() => resolve())
        .catch(e => reject(e));
    });
  }

  copyFileOnRemote(sourceGCSUri: GCSURI, destinationGCSUri: GCSURI): Promise<void> {
    return new Promise((resolve, reject) => {
      const sourceFile = this.client.bucket(sourceGCSUri.bucket).file(sourceGCSUri.filepath);
      const destinationFile = this.client.bucket(destinationGCSUri.bucket).file(destinationGCSUri.filepath);
      sourceFile.copy(destinationFile)
        .then(() => resolve())
        .catch(e => reject(e));
    });
  }

}

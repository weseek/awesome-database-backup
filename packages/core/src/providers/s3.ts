import { IProvider } from '../interfaces/provider'
import {
  S3Client, S3ClientConfig,
  GetObjectCommand, GetObjectCommandInput,
  PutObjectCommand, PutObjectCommandInput,
  CopyObjectCommand, CopyObjectCommandInput,
  DeleteObjectCommand, DeleteObjectCommandInput,
  ListObjectsCommand, ListObjectsCommandInput
} from "@aws-sdk/client-s3";
import { stat, readFileSync, createWriteStream } from 'fs';

interface S3URI {
  bucket: string,
  key: string
}

/**
 * Parse file path or URI(start with "s3:")
 */
function parseFilePath(path: string): S3URI | string | null {
  /* S3 URI */
  if (path.startsWith('s3:')) {
    // https://regex101.com/r/vDGuGY/1
    const regexS3Uri = /^s3:\/\/([^\/]+)\/?(.*)$/;
    try {
      const match = path.match(regexS3Uri);
      if (!match) return null;
      const [, bucket, key] = match;
      return { bucket, key };
    }
    catch(e) {
      return null;
    }
  /* Local file path */
  } else {
    stat(path, (error, stats) => {
      if (error) return null;
      if (!stats.isFile()) return null;
      return path;
    });
  }
  return null;
}

export class S3Provider implements IProvider {
  client: S3Client

  constructor(config: S3ClientConfig) {
    this.client = new S3Client(config);
  }

  exists(url: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.listFiles(url)
        .then((lists) => {
          resolve(lists.length > 0);
        })
        .catch(() => {
          reject(false);
        });
      });
  }

  listFiles(url: string): Promise<string[]> {
    const parseResult = parseFilePath(url);
    if (typeof parseResult != 'object') return Promise.resolve([]);

    const s3Uri = parseResult as S3URI;
    const params: ListObjectsCommandInput = {
      Bucket: s3Uri.bucket
    };
    const command = new ListObjectsCommand(params);
    return new Promise((resolve, reject) => {
      this.client.send(command)
        .then((response) => {
          if (response == null) reject('ListObjectsCommand return null');
          const contents = response.Contents as Object[];
          resolve(contents.map((content: any) => content.key));
        })
        .catch((e: any) => {
          reject(e);
        });
      });
  }

  deleteFile(url: string): Promise<void> {
    const parseResult = parseFilePath(url);
    if (typeof parseResult != 'object') return Promise.resolve();

    const s3Uri = parseResult as S3URI;
    const params: DeleteObjectCommandInput = {
      Bucket: s3Uri.bucket,
      Key: s3Uri.key
    };
    const command = new DeleteObjectCommand(params);
    return new Promise((resolve, reject) => {
      this.client.send(command)
        .then(() => {
          resolve();
        })
        .catch((e: any) => {
          reject(e);
        });
      });
  }

  copyFile(copySource: string, copyDestination: string): Promise<void> {
    const parseSourceResult = parseFilePath(copySource);
    const parseDestinationResult = parseFilePath(copyDestination);

    /* Upload local file to S3 */
    if (typeof parseSourceResult == 'string' && typeof parseDestinationResult == 'object') {
      const destinationS3Uri = parseDestinationResult as S3URI;
      return this.uploadFile(parseSourceResult, destinationS3Uri);
    }
    /* Download S3 object and save as local file */
    else if (typeof parseSourceResult == 'object' && typeof parseDestinationResult == 'string') {
      const sourceS3Uri = parseSourceResult as S3URI;
      return this.downloadFile(sourceS3Uri, parseDestinationResult);
    }
    /* Copy S3 object and save as another S3 object */
    else if (typeof parseSourceResult == 'object' && typeof parseDestinationResult == 'object') {
      const sourceS3Uri = parseSourceResult as S3URI;
      const destinationS3Uri = parseDestinationResult as S3URI;
      return this.copyFileOnRemote(sourceS3Uri, destinationS3Uri);
    }
    throw new Error('At least the copy source or destination must be an S3 endpoint.');
  }

  uploadFile(sourceFilePath: string, destinationS3Uri: S3URI): Promise<void> {
    const params: PutObjectCommandInput = {
      Bucket: destinationS3Uri.bucket,
      Key: destinationS3Uri.key,
      Body: readFileSync(sourceFilePath)
    };
    const command = new PutObjectCommand(params);
    return new Promise((resolve, reject) => {
      this.client.send(command)
        .then(() => {
          resolve();
        })
        .catch((e: any) => {
          reject(e);
        });
      });
  }

  downloadFile(sourceS3Uri: S3URI, destinationFilePath: string): Promise<void> {
    const params: GetObjectCommandInput = {
      Bucket: sourceS3Uri.bucket,
      Key: sourceS3Uri.key
    };
    const command = new GetObjectCommand(params);
    return new Promise((resolve, reject) => {
      this.client.send(command)
        .then((response) => {
          if (response == null) reject('GetObjectCommand return null');
          try {
            const readableStream = response.Body as ReadableStream;
            const writeStream = createWriteStream(destinationFilePath);
            const reader = readableStream.getReader();
            reader.read()
              .then(function processBytes({ done, value }): Promise<Object|undefined>|undefined {
                if (done) return;
                writeStream.write(value);
                return reader.read().then(processBytes);
              })
              .then(() => {
                resolve();
              })
              .catch((e: any) => {
                reject(e);
              });
          }
          catch(e) {
            reject(e);
          }
        })
        .catch((e: any) => {
          reject(e);
        });
      });  }

  copyFileOnRemote(sourceS3Uri: S3URI, destinationS3Uri: S3URI): Promise<void> {
    const params: CopyObjectCommandInput = {
      CopySource: [sourceS3Uri.bucket, sourceS3Uri.key].join('/'),
      Bucket: destinationS3Uri.bucket,
      Key: destinationS3Uri.key
    };
    const command = new CopyObjectCommand(params);
    return new Promise((resolve, reject) => {
      this.client.send(command)
        .then(() => {
          resolve();
        })
        .catch((e: any) => {
          reject(e);
        });
      });
  }
}

import { readFileSync, createWriteStream } from 'fs';
import { basename } from 'path';
import {
  S3Client, S3ClientConfig,
  GetObjectCommand, GetObjectCommandInput,
  PutObjectCommand, PutObjectCommandInput,
  CopyObjectCommand, CopyObjectCommandInput,
  DeleteObjectCommand, DeleteObjectCommandInput,
  ListObjectsCommand,
} from '@aws-sdk/client-s3';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { promises as StreamPromises, Readable } from 'stream';
import path from 'node:path';
import {
  IStorageServiceClient,
  listS3FilesOptions,
  S3URI,
  S3StorageServiceClientConfig,
} from './interfaces';

/**
 * Client to manipulate S3 buckets
 */
export class S3StorageServiceClient implements IStorageServiceClient {

  name: string;

  client: S3Client;

  constructor(config: S3StorageServiceClientConfig) {
    const s3ClientConfig: S3ClientConfig = {};

    // Set region if specified
    if (config.awsRegion) {
      s3ClientConfig.region = config.awsRegion;
    }
    // Set endpoint if specified
    if (config.awsEndpointUrl) {
      s3ClientConfig.endpoint = config.awsEndpointUrl.toString();
    }
    // Set credentials
    if (config.awsAccessKeyId && config.awsSecretAccessKey) {
      // If explicit credentials are provided, use them directly
      s3ClientConfig.credentials = {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      };
    }
    else {
      // Otherwise use the credential provider chain
      s3ClientConfig.credentials = fromNodeProviderChain();
    }

    this.name = 'S3';
    this.client = new S3Client(s3ClientConfig);
  }

  async exists(url: string): Promise<boolean> {
    const files = await this.listFiles(url);
    return files.length > 0;
  }

  /**
   * List objects specified by S3's URI
   *
   * If the URI is not a folder, only objects with an exact match will be returned.
   * You can get an prefix matched object name by setting the "exactMatch" option to false.
   *
   * If the URI is a folder, it returns a list of objects under the folder. (URL must end with a slash)
   * You can remove a folder from the list by setting the "includeFolderInList" option to false.
   *
   * The returned list will be the absolute path from the bucket.
   * (If the url is "s3://bucket-name/directory", it will look like ["/directory/object-name1", "/directory/object-name2"])
   * You can get only object name by setting the "absolutePath" option to false.
   * (If the url is "s3://bucket-name/directory", it will look like ["object-name1", "object-name2"])
   */
  async listFiles(url: string, optionsRequired?: listS3FilesOptions): Promise<string[]> {
    const parseResult = this._parseFilePath(url);
    if (parseResult == null) throw new Error(`URI ${url} is not correct S3's`);

    const defaultOption: listS3FilesOptions = {
      includeFolderInList: false,
      absolutePath: true,
      exactMatch: true,
    };
    const options = optionsRequired ? { ...defaultOption, ...optionsRequired } : defaultOption;
    const s3Uri = parseResult as S3URI;

    const command = new ListObjectsCommand({
      Bucket: s3Uri.bucket,
      Prefix: s3Uri.key,
    });
    const response = await this.client.send(command);
    if (response == null) throw new Error('ListObjectsCommand return null or Contents is null');

    let files = response.Contents?.map((content: any) => content.Key) || [];
    if (url.endsWith('/') && !options.includeFolderInList) {
      const excludeFolderFilter = (filePath: string) => filePath !== s3Uri.key;
      files = files.filter(excludeFolderFilter);
    }
    if (!url.endsWith('/') && options.exactMatch) {
      const exactMatchFilter = (filePath: string) => filePath === s3Uri.key;
      files = files.filter(exactMatchFilter);
    }
    if (!options.absolutePath) {
      const relativePathChanger = (filePath: string) => basename(filePath);
      files = files.map(relativePathChanger);
    }
    return files;
  }

  /**
   * Delete an object specified by S3's URI
   *
   * The function will not fail even if the object to be deleted does not exist.
   * Also, when removing a directory, the URL must end with a slash. (ex. 's3://bucket-name/directory/')
   */
  async deleteFile(url: string): Promise<void> {
    const s3Uri = this._parseFilePath(url);
    if (s3Uri == null) throw new Error(`URI ${url} is not correct S3's`);

    const params: DeleteObjectCommandInput = {
      Bucket: s3Uri.bucket,
      Key: s3Uri.key,
    };
    const command = new DeleteObjectCommand(params);
    await this.client.send(command);
  }

  /**
   * Copy a single file
   *
   * The file to be copied can also seamlessly handle objects on S3.
   * If the copy source is a local file and the copy destination is the URI of S3, the file is uploaded to S3.
   * If the source and destination are S3 URIs, the S3 object will be copied directly.
   */
  async copyFile(copySource: string, copyDestination: string): Promise<void> {
    const parseSourceResult = this._parseFilePath(copySource);
    const parseDestinationResult = this._parseFilePath(copyDestination);

    /* Upload local file to S3 */
    if (parseSourceResult == null && parseDestinationResult != null) {
      const destinationS3Uri = parseDestinationResult as S3URI;
      return this.uploadFile(copySource, destinationS3Uri);
    }
    /* Download S3 object and save as local file */
    if (parseSourceResult != null && parseDestinationResult == null) {
      const sourceS3Uri = parseSourceResult as S3URI;
      return this.downloadFile(sourceS3Uri, copyDestination);
    }
    /* Copy S3 object and save as another S3 object */
    if (parseSourceResult != null && parseDestinationResult != null) {
      const sourceS3Uri = parseSourceResult as S3URI;
      const destinationS3Uri = parseDestinationResult as S3URI;
      return this.copyFileOnRemote(sourceS3Uri, destinationS3Uri);
    }

    throw new Error('At least the copy source or destination must be an S3 endpoint.');
  }

  async uploadFile(sourceFilePath: string, destinationS3Uri: S3URI): Promise<void> {
    const params: PutObjectCommandInput = {
      Bucket: destinationS3Uri.bucket,
      Key: (destinationS3Uri.key === '' || destinationS3Uri.key.endsWith('/'))
        ? (destinationS3Uri.key + basename(sourceFilePath))
        : destinationS3Uri.key,
      Body: readFileSync(sourceFilePath),
    };
    const command = new PutObjectCommand(params);

    await this.client.send(command);
  }

  async downloadFile(sourceS3Uri: S3URI, destinationFilePath: string): Promise<void> {
    const params: GetObjectCommandInput = {
      Bucket: sourceS3Uri.bucket,
      Key: sourceS3Uri.key,
    };
    const command = new GetObjectCommand(params);
    const response = await this.client.send(command);
    if (response == null || response.Body == null) throw new Error('GetObjectCommand return null');

    await StreamPromises.pipeline(
      response.Body as Readable,
      createWriteStream(destinationFilePath),
    );
  }

  async copyFileOnRemote(sourceS3Uri: S3URI, destinationS3Uri: S3URI): Promise<void> {
    const params: CopyObjectCommandInput = {
      CopySource: path.join(sourceS3Uri.bucket, sourceS3Uri.key),
      Bucket: destinationS3Uri.bucket,
      Key: destinationS3Uri.key,
    };
    const command = new CopyObjectCommand(params);

    await this.client.send(command);
  }

  /**
   * Upload a stream directly to S3
   *
   * This method allows streaming data directly to S3 without creating temporary files.
   * Useful for large data transfers where you want to avoid disk I/O.
   */
  async uploadStream(stream: Readable, fileName: string, destinationUri: string): Promise<void> {
    const destinationS3Uri = this._parseFilePath(destinationUri);
    if (destinationS3Uri == null) throw new Error(`URI ${destinationUri} is not correct S3's`);

    // Collect stream data in buffer before uploading
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    const params: PutObjectCommandInput = {
      Bucket: destinationS3Uri.bucket,
      Key: path.join(destinationS3Uri.key, fileName),
      Body: buffer,
    };
    const command = new PutObjectCommand(params);

    await this.client.send(command);
  }

  /**
   * Parse S3's URI(start with "s3:")
   * If it is not S3's URL, return null.
   */
  private _parseFilePath(path: string): S3URI | null {
    /* S3 URI */
    if (path.startsWith('s3:')) {
      // https://regex101.com/r/vDGuGY/1
      const regexS3Uri = /^s3:\/\/([^/]+)\/?(.*)$/;
      try {
        const match = path.match(regexS3Uri);
        if (!match) return null;
        const [, bucket, key] = match;
        return { bucket, key };
      }
      catch (e: any) {
        return null;
      }
    }
    return null;
  }

}

export default S3StorageServiceClient;

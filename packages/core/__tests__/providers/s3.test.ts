import { S3Provider } from '@awesome-backup/core';
import {
  S3Client, S3ClientConfig,
  GetObjectCommand, GetObjectCommandInput,
  PutObjectCommand, PutObjectCommandInput,
  CopyObjectCommand, CopyObjectCommandInput,
  DeleteObjectCommand, DeleteObjectCommandInput, DeleteObjectCommandOutput,
  ListObjectsCommand, ListObjectsCommandInput, ListObjectsCommandOutput
} from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3');
const S3ClientMock = S3Client as jest.MockedClass<typeof S3Client>;

describe('S3Provider', () => {
  describe('#listFiles', () => {

    describe('when S3Client#send response files', () => {
      test('it return files', async() => {
        S3ClientMock.prototype.send.mockImplementation(() => {
          return new Promise<ListObjectsCommandOutput|null>((resolve) => {
            resolve({ $metadata: {}, Contents: [{ Key: 'file1' }] });
          });
        });

        const provider = new S3Provider({});
        const url = 's3://bucket-name/object-name';
        expect(await provider.listFiles(url)).toStrictEqual(['file1']);
      });
    });

    describe('when request URI is not S3\'s', () => {
      test('it reject with throw exception', async() => {
        const provider = new S3Provider({});
        const url = 'http://hostname/';
        await expect(provider.listFiles(url)).rejects.toThrow();
      });
    });

    describe('when S3Client#send response null', () => {
      test('it reject with throw exception', async() => {
        S3ClientMock.prototype.send.mockImplementation(() => {
          return new Promise<ListObjectsCommandOutput|null>((resolve) => {
            resolve(null);
          });
        });

        const provider = new S3Provider({});
        const url = 's3://bucket-name/object-name';
        await expect(provider.listFiles(url)).rejects.toThrow();
      });
    });
  });

  describe('#deleteFile', () => {
    describe('when S3Client#send success', () => {
      test('it resolve with undfined', async() => {
        S3ClientMock.prototype.send.mockImplementation(() => {
          return new Promise<DeleteObjectCommandOutput|null>(resolve => resolve(null));
        });

        const provider = new S3Provider({});
        const url = 's3://bucket-name/object-name';
        await expect(provider.deleteFile(url)).resolves.toBe(undefined);
      });
    });

    describe('when request URI is not S3\'s', () => {
      test('it reject with throw exception', async() => {
        const provider = new S3Provider({});
        const url = 'http://hostname/';
        await expect(provider.deleteFile(url)).rejects.toThrow();
      });
    });

    describe('when S3Client#send fail', () => {
      test('it reject with throw exception', async() => {
        S3ClientMock.prototype.send.mockImplementation(() => {
          return new Promise<DeleteObjectCommandOutput|null>((resolve, reject) => {
            reject(new Error('some error occur'));
          });
        });

        const provider = new S3Provider({});
        const url = 's3://bucket-name/object-name';
        await expect(provider.deleteFile(url)).rejects.toThrow();
      });
    });
  });
});

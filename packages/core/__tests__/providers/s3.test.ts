import {
  GetObjectCommandOutput,
  PutObjectCommandOutput,
  DeleteObjectCommandOutput,
  ListObjectsCommandOutput,
  CopyObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { PassThrough, Readable } from 'stream';

let s3client = require('@aws-sdk/client-s3');
let core = require('@awesome-backup/core');
let fs = require('fs');

describe('S3Provider', () => {
  beforeEach(async() => {
    jest.resetModules();
    jest.dontMock('@awesome-backup/core');
    jest.dontMock('@aws-sdk/client-s3');
    s3client = require('@aws-sdk/client-s3');
    core = require('@awesome-backup/core');
    fs = require('fs');
  });

  describe('#exists', () => {
    describe('when listFiles() return object key list which include target object', () => {
      beforeEach(() => {
        core.S3Provider.prototype.listFiles = jest.fn().mockImplementationOnce(() => {
          return new Promise<string[]>((resolve) => {
            return resolve(['object-name']);
          });
        });
      });

      it('return true', async() => {
        const provider = new core.S3Provider({});
        const url = 's3://bucket-name/object-name';
        await expect(provider.exists(url)).resolves.toBe(true);
      });

    });
  });

  describe('#listFiles', () => {
    describe('when S3Client#send response files', () => {
      beforeEach(() => {
        s3client.S3Client.prototype.send = jest.fn().mockImplementation(() => {
          return new Promise<ListObjectsCommandOutput|null>(resolve => resolve({
            $metadata: {}, Contents: [{ Key: 'file1' }],
          }));
        });
      });

      it('return files', async() => {
        const provider = new core.S3Provider({});
        const url = 's3://bucket-name/';
        await expect(provider.listFiles(url)).resolves.toStrictEqual(['file1']);
      });
    });

    describe('when request URI is not S3\'s', () => {
      it('reject with throw exception', async() => {
        const provider = new core.S3Provider({});
        const url = 'http://hostname/';
        await expect(provider.listFiles(url)).rejects.toThrowError();
      });
    });

    describe('when S3Client#send response null', () => {
      beforeEach(() => {
        s3client.S3Client.prototype.send = jest.fn().mockImplementation(() => {
          return new Promise<ListObjectsCommandOutput|null>(resolve => resolve(null));
        });
      });

      it('reject with throw exception', async() => {
        const provider = new core.S3Provider({});
        const url = 's3://bucket-name/object-name';
        await expect(provider.listFiles(url)).rejects.toThrowError();
      });
    });

    describe('when S3Client#send reject', () => {
      beforeEach(() => {
        s3client.S3Client.prototype.send = jest.fn().mockImplementation(() => {
          return new Promise<ListObjectsCommandOutput|null>((resolve, reject) => reject(new Error('some error')));
        });
      });

      it('reject with throw exception', async() => {
        const provider = new core.S3Provider({});
        const url = 's3://bucket-name/object-name';
        await expect(provider.listFiles(url)).rejects.toThrow();
      });
    });
  });

  describe('#deleteFile', () => {
    describe('when S3Client#send success', () => {
      beforeEach(() => {
        s3client.S3Client.prototype.send = jest.fn().mockImplementation(() => {
          return new Promise<DeleteObjectCommandOutput|null>(resolve => resolve(null));
        });
      });

      it('resolve with undfined', async() => {
        const provider = new core.S3Provider({});
        const url = 's3://bucket-name/object-name';
        await expect(provider.deleteFile(url)).resolves.toBe(undefined);
      });
    });

    describe('when request URI is not S3\'s', () => {
      it('reject and throw Error', async() => {
        const provider = new core.S3Provider({});
        const url = 'http://hostname/';
        await expect(provider.deleteFile(url)).rejects.toThrowError();
      });
    });

    describe('when S3Client#send fail', () => {
      beforeEach(() => {
        s3client.S3Client.prototype.send = jest.fn().mockImplementation(() => {
          return new Promise<DeleteObjectCommandOutput|null>((resolve, reject) => reject(new Error('some error occur')));
        });
      });

      it('reject and throw Error', async() => {
        const provider = new core.S3Provider({});
        const url = 's3://bucket-name/object-name';
        await expect(provider.deleteFile(url)).rejects.toThrowError();
      });
    });
  });

  describe('#copyFile', () => {
    describe('when copySource is local file path and copyDestination is S3\'s URI', () => {
      beforeEach(async() => {
        core.S3Provider.prototype.uploadFile = jest.fn().mockImplementation(() => {
          return new Promise<void>((resolve) => {
            return resolve();
          });
        });
      });

      it('call uploadFile()', async() => {
        const provider = new core.S3Provider({});
        await provider.copyFile('/path/to/file', 's3://bucket-name/object-name');
        expect(core.S3Provider.prototype.uploadFile).toBeCalled();
      });
    });

    describe('when copySource is S3\'s URI and copyDestination is local file path', () => {
      beforeEach(() => {
        core.S3Provider.prototype.downloadFile = jest.fn().mockImplementation(() => {
          return new Promise<void>((resolve) => {
            return resolve();
          });
        });
      });

      it('call downloadFile()', async() => {
        const provider = new core.S3Provider({});
        await provider.copyFile('s3://bucket-name/object-name', '/path/to/file');
        expect(core.S3Provider.prototype.downloadFile).toBeCalled();
      });
    });

    describe('when copySource and copyDestination are both S3\'s URI', () => {
      beforeEach(() => {
        core.S3Provider.prototype.copyFileOnRemote = jest.fn().mockImplementation(() => {
          return new Promise<void>((resolve) => {
            return resolve();
          });
        });
      });

      it('call copyFileOnRemote()', async() => {
        const provider = new core.S3Provider({});
        await provider.copyFile('s3://bucket-name/object-name1', 's3://bucket-name/object-name2');
        expect(core.S3Provider.prototype.copyFileOnRemote).toBeCalled();
      });
    });

    describe('when copySource and copyDestination are invalid', () => {
      it('reject and throw Error', async() => {
        const provider = new core.S3Provider({});
        await expect(provider.copyFile('gcs://bucket-name/object-name1', 'gcs://bucket-name/object-name2')).rejects.toThrowError();
      });
    });
  });

  describe('#uploadFile', () => {
    describe('when S3Client#send resolve', () => {
      beforeEach(async() => {
        s3client.S3Client.prototype.send = jest.fn().mockImplementation(() => {
          return new Promise<PutObjectCommandOutput|null>(resolve => resolve(null));
        });
        fs.readFileSync = jest.fn().mockReturnValue('some body');
      });

      it('resolve with undfined', async() => {
        const provider = new core.S3Provider({});
        const s3uri = { bucket: 'bucket-name', key: 'object-name' };
        await expect(provider.uploadFile('/path/to/file', s3uri)).resolves.toBe(undefined);
      });
    });

    describe('when S3Client#send reject', () => {
      beforeEach(async() => {
        s3client.S3Client.prototype.send = jest.fn().mockImplementation(() => {
          return new Promise<PutObjectCommandOutput|null>((resolve, reject) => reject(new Error('some error')));
        });
      });

      it('reject and throw Error', async() => {
        const provider = new core.S3Provider({});
        const s3uri = { bucket: 'bucket-name', key: 'object-name' };
        await expect(provider.uploadFile('/path/to/file', s3uri)).rejects.toThrowError();
      });
    });
  });

  describe('#downloadFile', () => {
    describe('when S3Client#send resolve', () => {
      beforeEach(async() => {
        s3client.S3Client.prototype.send = jest.fn().mockImplementation(() => {
          return new Promise<any>((resolve) => {
            resolve({
              $metadata: {},
              Body: jest.fn().mockImplementation(() => {
                const readable = new Readable();
                readable.push(null);
                return readable;
              }),
            });
          });
        });
        fs.createWriteStream = jest.fn().mockReturnValue(new PassThrough());
      });

      it('resolve', async() => {
        const provider = new core.S3Provider({});
        const s3uri = { bucket: 'bucket-name', key: 'object-name' };
        await expect(provider.downloadFile(s3uri, '/path/to/file')).resolves.toBe(undefined);
      });
    });

    describe('when S3Client#send reject', () => {
      beforeEach(async() => {
        s3client.S3Client.prototype.send = jest.fn().mockImplementation(() => {
          return new Promise<GetObjectCommandOutput|null>((resolve, reject) => reject(new Error('some error')));
        });
      });

      it('reject and throw Error', async() => {
        const provider = new core.S3Provider({});
        const s3uri = { bucket: 'bucket-name', key: 'object-name' };
        await expect(provider.downloadFile(s3uri, '/path/to/file')).rejects.toThrowError();
      });
    });
  });
  describe('#copyFileOnRemote', () => {
    describe('when S3Client#send resolve', () => {
      beforeEach(async() => {
        s3client.S3Client.prototype.send = jest.fn().mockImplementation(() => {
          return new Promise<CopyObjectCommandOutput|null>(resolve => resolve(null));
        });
      });

      it('resolve with undfined', async() => {
        const provider = new core.S3Provider({});
        const s3uriSource = { bucket: 'bucket-name', key: 'object-name1' };
        const s3uriDestination = { bucket: 'bucket-name', key: 'object-name2' };
        await expect(provider.copyFileOnRemote(s3uriSource, s3uriDestination)).resolves.toBe(undefined);
      });
    });

    describe('when S3Client#send reject', () => {
      beforeEach(async() => {
        s3client.S3Client.prototype.send = jest.fn().mockImplementation(() => {
          return new Promise<CopyObjectCommandOutput|null>((resolve, reject) => reject(new Error('some error')));
        });
      });

      it('reject and throw Error', async() => {
        const provider = new core.S3Provider({});
        const s3uriSource = { bucket: 'bucket-name', key: 'object-name1' };
        const s3uriDestination = { bucket: 'bucket-name', key: 'object-name2' };
        await expect(provider.copyFileOnRemote(s3uriSource, s3uriDestination)).rejects.toThrowError();
      });
    });
  });
});

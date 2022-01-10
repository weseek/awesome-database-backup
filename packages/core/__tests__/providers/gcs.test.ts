import { GetFilesResponse } from '@google-cloud/storage';

let core = require('@awesome-backup/core');
let storage = require('@google-cloud/storage');

describe('GCSProvider', () => {
  beforeEach(async() => {
    jest.resetModules();
    jest.dontMock('@awesome-backup/core');
    jest.dontMock('@google-cloud/storage');
    core = require('@awesome-backup/core');
    storage = require('@google-cloud/storage');
  });

  describe('#exists', () => {
    describe('when listFiles() return object key list which include target object', () => {
      beforeEach(() => {
        core.GCSProvider.prototype.listFiles = jest.fn().mockImplementationOnce(() => {
          return new Promise<string[]>((resolve) => {
            return resolve(['object-name']);
          });
        });
      });

      it('return true', async() => {
        const provider = new core.GCSProvider({});
        const url = 'gs://bucket-name/object-name';
        await expect(provider.exists(url)).resolves.toBe(true);
      });

    });
  });

  describe('#listFiles', () => {
    describe('when Bucket#getFiles response files', () => {
      beforeEach(() => {
      });

      it('return files', async() => {
        const bucketMock = {
          getFiles: jest.fn().mockReturnValue(Promise.resolve([{ name: 'file1' }])),
        };

        const provider = new core.GCSProvider({});
        provider.client.bucket = jest.fn().mockReturnValue(bucketMock);
        const url = 'gs://bucket-name/';
        await expect(provider.listFiles(url)).resolves.toStrictEqual(['file1']);
      });
    });

    describe('when request URI is not GCS\'s', () => {
      it('reject with throw exception', async() => {
        const provider = new core.GCSProvider({});
        const url = 'http://hostname/';
        await expect(provider.listFiles(url)).rejects.toThrowError();
      });
    });

    describe('when Bucket#getFiles response null', () => {
      it('reject with throw exception', async() => {
        const bucketMock = {
          getFiles: jest.fn().mockReturnValue(Promise.resolve(null)),
        };

        const provider = new core.GCSProvider({});
        provider.client.bucket = jest.fn().mockReturnValue(bucketMock);
        const url = 'gs://bucket-name/object-name';
        await expect(provider.listFiles(url)).rejects.toThrowError();
      });
    });

    describe('when Bucket#getFiles reject', () => {
      it('reject with throw exception', async() => {
        const bucketMock = {
          getFiles: jest.fn().mockReturnValue(Promise.resolve(null)),
        };

        const provider = new core.GCSProvider({});
        provider.client.bucket = jest.fn().mockReturnValue(bucketMock);
        const url = 's3://bucket-name/object-name';
        await expect(provider.listFiles(url)).rejects.toThrow();
      });
    });
  });

  describe('#deleteFile', () => {
    describe('when File#delete success', () => {
      it('resolve with undfined', async() => {
        const fileMock = {
          delete: jest.fn().mockReturnValue(Promise.resolve()),
        };
        const bucketMock = {
          file: jest.fn().mockReturnValue(fileMock),
        };

        const provider = new core.GCSProvider({});
        provider.client.bucket = jest.fn().mockReturnValue(bucketMock);
        const url = 'gs://bucket-name/object-name';
        await expect(provider.deleteFile(url)).resolves.toBe(undefined);
      });
    });

    describe('when request URI is not GCS\'s', () => {
      it('reject and throw Error', async() => {
        const provider = new core.GCSProvider({});
        const url = 'http://hostname/';
        await expect(provider.deleteFile(url)).rejects.toThrowError();
      });
    });

    describe('when File#delete fail', () => {
      it('reject and throw Error', async() => {
        const fileMock = {
          delete: jest.fn().mockReturnValue(Promise.reject(new Error('some error'))),
        };
        const bucketMock = {
          file: jest.fn().mockReturnValue(fileMock),
        };

        const provider = new core.GCSProvider({});
        provider.client.bucket = jest.fn().mockReturnValue(bucketMock);
        const url = 'gs://bucket-name/object-name';
        await expect(provider.deleteFile(url)).rejects.toThrowError();
      });
    });
  });

  describe('#copyFile', () => {
    describe('when copySource is local file path and copyDestination is GCS\'s URI', () => {
      beforeEach(async() => {
        core.GCSProvider.prototype.uploadFile = jest.fn().mockImplementation(() => {
          return new Promise<void>((resolve) => {
            return resolve();
          });
        });
      });

      it('call uploadFile()', async() => {
        const provider = new core.GCSProvider({});
        await provider.copyFile('/path/to/file', 'gs://bucket-name/object-name');
        expect(core.GCSProvider.prototype.uploadFile).toBeCalled();
      });
    });

    describe('when copySource is GCS\'s URI and copyDestination is local file path', () => {
      beforeEach(() => {
        core.GCSProvider.prototype.downloadFile = jest.fn().mockImplementation(() => {
          return new Promise<void>((resolve) => {
            return resolve();
          });
        });
      });

      it('call downloadFile()', async() => {
        const provider = new core.GCSProvider({});
        await provider.copyFile('gs://bucket-name/object-name', '/path/to/file');
        expect(core.GCSProvider.prototype.downloadFile).toBeCalled();
      });
    });

    describe('when copySource and copyDestination are both GCS\'s URI', () => {
      beforeEach(() => {
        core.GCSProvider.prototype.copyFileOnRemote = jest.fn().mockImplementation(() => {
          return new Promise<void>((resolve) => {
            return resolve();
          });
        });
      });

      it('call copyFileOnRemote()', async() => {
        const provider = new core.GCSProvider({});
        await provider.copyFile('gs://bucket-name/object-name1', 'gs://bucket-name/object-name2');
        expect(core.GCSProvider.prototype.copyFileOnRemote).toBeCalled();
      });
    });

    describe('when copySource and copyDestination are invalid', () => {
      it('reject and throw Error', async() => {
        const provider = new core.GCSProvider({});
        await expect(provider.copyFile('s3://bucket-name/object-name1', 's3://bucket-name/object-name2')).rejects.toThrowError();
      });
    });
  });

  describe('#uploadFile', () => {
    describe('when File#upload resolve', () => {
      it('resolve with undfined', async() => {
        const bucketMock = {
          upload: jest.fn().mockReturnValue(Promise.resolve()),
        };

        const provider = new core.GCSProvider({});
        provider.client.bucket = jest.fn().mockReturnValue(bucketMock);
        const gcsuri = { bucket: 'bucket-name', key: 'object-name' };
        await expect(provider.uploadFile('/path/to/file', gcsuri)).resolves.toBe(undefined);
      });
    });

    describe('when File#upload reject', () => {
      it('reject and throw Error', async() => {
        const bucketMock = {
          upload: jest.fn().mockReturnValue(Promise.reject(new Error('some error'))),
        };

        const provider = new core.GCSProvider({});
        provider.client.bucket = jest.fn().mockReturnValue(bucketMock);
        const gcsuri = { bucket: 'bucket-name', key: 'object-name' };
        await expect(provider.uploadFile('/path/to/file', gcsuri)).rejects.toThrowError();
      });
    });
  });


  describe('#downloadFile', () => {
    describe('when File#download resolve', () => {
      it('resolve', async() => {
        const fileMock = {
          download: jest.fn().mockReturnValue(Promise.resolve()),
        };
        const bucketMock = {
          file: jest.fn().mockReturnValue(fileMock),
        };

        const provider = new core.GCSProvider({});
        provider.client.bucket = jest.fn().mockReturnValue(bucketMock);
        const gcsuri = { bucket: 'bucket-name', key: 'object-name' };
        await expect(provider.downloadFile(gcsuri, '/path/to/file')).resolves.toBe(undefined);
      });
    });

    describe('when GCSClient#send reject', () => {
      it('reject and throw Error', async() => {
        const fileMock = {
          download: jest.fn().mockReturnValue(Promise.reject(new Error('some error'))),
        };
        const bucketMock = {
          file: jest.fn().mockReturnValue(fileMock),
        };

        const provider = new core.GCSProvider({});
        provider.client.bucket = jest.fn().mockReturnValue(bucketMock);
        const gcsuri = { bucket: 'bucket-name', key: 'object-name' };
        await expect(provider.downloadFile(gcsuri, '/path/to/file')).rejects.toThrowError();
      });
    });
  });

  describe('#copyFileOnRemote', () => {
    describe('when File#copy resolve', () => {
      it('resolve with undfined', async() => {
        const fileMock = {
          copy: jest.fn().mockReturnValue(Promise.resolve()),
        };
        const bucketMock = {
          file: jest.fn().mockReturnValue(fileMock),
        };

        const provider = new core.GCSProvider({});
        provider.client.bucket = jest.fn().mockReturnValue(bucketMock);
        const gcsuriSource = { bucket: 'bucket-name', key: 'object-name1' };
        const gcsuriDestination = { bucket: 'bucket-name', key: 'object-name2' };
        await expect(provider.copyFileOnRemote(gcsuriSource, gcsuriDestination)).resolves.toBe(undefined);
      });
    });

    describe('when File#copy reject', () => {
      it('reject and throw Error', async() => {
        const fileMock = {
          copy: jest.fn().mockReturnValue(Promise.reject(new Error('some error'))),
        };
        const bucketMock = {
          file: jest.fn().mockReturnValue(fileMock),
        };

        const provider = new core.GCSProvider({});
        provider.client.bucket = jest.fn().mockReturnValue(bucketMock);
        const gcsuriSource = { bucket: 'bucket-name', key: 'object-name1' };
        const gcsuriDestination = { bucket: 'bucket-name', key: 'object-name2' };
        await expect(provider.copyFileOnRemote(gcsuriSource, gcsuriDestination)).rejects.toThrowError();
      });
    });
  });

});

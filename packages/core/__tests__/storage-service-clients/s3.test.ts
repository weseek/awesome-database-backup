import { PassThrough, Readable } from 'stream';
import { S3URI, S3StorageServiceClientConfig } from '../../src/storage-service-clients/interfaces';
import S3StorageServiceClient from '../../src/storage-service-clients/s3';

afterEach(() => {
  jest.resetModules();
  jest.dontMock('@awesome-backup/core');
  jest.dontMock('@aws-sdk/client-s3');
  jest.dontMock('fs');
  jest.dontMock('stream');
  jest.dontMock('../../src/storage-service-clients/s3-config');
});

describe('S3StorageServiceClient', () => {
  let s3ServiceClient: S3StorageServiceClient;
  const s3BareMinimumConfig = {
    awsRegion: 'validRegion',
    awsAccessKeyId: 'validAccessKeyId',
    awsSecretAccessKey: 'validSecretAccessKey',
  };

  describe('constructor', () => {
    describe('when config file exists', () => {
      const config: S3StorageServiceClientConfig = {};

      beforeEach(() => {
        jest.resetModules();
        jest.doMock('../../src/storage-service-clients/s3-config', () => ({
          configExistS3: jest.fn().mockReturnValue(true),
        }));
      });

      it('return undefined', () => {
        const s3 = require('../../src/storage-service-clients/s3');
        expect(new s3.S3StorageServiceClient(config).constructor.name).toBe('S3StorageServiceClient');
      });
    });

    describe('when config file does not exists', () => {
      let config: S3StorageServiceClientConfig;
      const S3ClientMock = jest.fn();

      beforeEach(() => {
        jest.resetModules();
        jest.doMock('../../src/storage-service-clients/s3-config', () => ({
          configExistS3: jest.fn().mockReturnValue(false),
        }));
        jest.doMock('@aws-sdk/client-s3', () => ({
          ...(jest.requireActual('@aws-sdk/client-s3') as any),
          S3Client: S3ClientMock,
        }));
      });

      describe('when config is empty', () => {
        beforeAll(() => {
          config = {};
        });

        it('throw error', () => {
          const s3 = require('../../src/storage-service-clients/s3');
          expect(() => new s3.S3StorageServiceClient(config))
            .toThrowError(new Error(
              'If the configuration file does not exist, '
                + 'you will need to set "--aws-region", "--aws-access-key-id", and "--aws-secret-access-key".',
            ));
        });
      });

      describe('when config is valid without "awsEndpointUrl"', () => {
        beforeAll(() => {
          config = s3BareMinimumConfig;
        });

        it('throw error', () => {
          const s3 = require('../../src/storage-service-clients/s3');
          expect(new s3.S3StorageServiceClient(config).constructor.name).toBe('S3StorageServiceClient');
          expect(S3ClientMock).toBeCalledWith({
            region: 'validRegion',
            credentials: {
              accessKeyId: 'validAccessKeyId',
              secretAccessKey: 'validSecretAccessKey',
            },
          });
        });
      });

      describe('when config is valid with "awsEndpointUrl"', () => {
        beforeAll(() => {
          config = s3BareMinimumConfig;
        });

        it('call constructor of Storage class with args', () => {
          const s3 = require('../../src/storage-service-clients/s3');
          expect(new s3.S3StorageServiceClient(config).constructor.name).toBe('S3StorageServiceClient');
          expect(S3ClientMock).toBeCalledWith({
            region: 'validRegion',
            credentials: {
              accessKeyId: 'validAccessKeyId',
              secretAccessKey: 'validSecretAccessKey',
            },
          });
        });
      });
    });
  });

  beforeEach(() => {
    s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
  });

  describe('#exists', () => {
    const url = 's3://bucket-name/object-name';

    describe('when listFiles() return object key list which include target object', () => {
      beforeEach(() => {
        s3ServiceClient.listFiles = jest.fn().mockResolvedValue(['object-name']);
      });

      it('return true', async() => {
        await expect(s3ServiceClient.exists(url)).resolves.toBe(true);
      });
    });

    describe('when listFiles() reject', () => {
      beforeEach(() => {
        s3ServiceClient.listFiles = jest.fn().mockRejectedValue(undefined);
      });

      it('reject', async() => {
        await expect(s3ServiceClient.exists(url)).rejects.toBe(undefined);
      });
    });
  });

  describe('#listFiles', () => {
    let s3ServiceClient: S3StorageServiceClient;

    const doMockClientS3AndReloadS3ServiceClient = (clientS3Mock: jest.Mock) => {
      jest.resetModules();
      jest.doMock('@aws-sdk/client-s3', () => {
        const mock = jest.requireActual('@aws-sdk/client-s3');
        mock.S3Client.prototype.send = clientS3Mock;
        return mock;
      });
      const { S3StorageServiceClient } = require('../../src/storage-service-clients/s3');
      s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
    };

    describe("when request URI is valid S3's", () => {
      describe('when options are not specified', () => {
        describe('when request URI is bucket', () => {
          const url = 's3://bucket-name/';

          describe('when S3Client#send response files', () => {
            beforeEach(() => {
              doMockClientS3AndReloadS3ServiceClient(jest.fn().mockResolvedValue({
                $metadata: {},
                Contents: [
                  { Key: 'file1' },
                ],
              }));
            });

            it('return files', async() => {
              await expect(s3ServiceClient.listFiles(url)).resolves.toStrictEqual(['file1']);
            });
          });
        });

        describe('when request URI is object', () => {
          const url = 's3://bucket-name/object-name';

          describe('when S3Client#send response exact matched files', () => {
            beforeEach(() => {
              doMockClientS3AndReloadS3ServiceClient(jest.fn().mockResolvedValue({
                $metadata: {},
                Contents: [
                  { Key: 'object-name' },
                ],
              }));
            });

            it('return matched files', async() => {
              await expect(s3ServiceClient.listFiles(url)).resolves.toStrictEqual(['object-name']);
            });
          });

          describe('when S3Client#send response not exact matched files', () => {
            beforeEach(() => {
              doMockClientS3AndReloadS3ServiceClient(jest.fn().mockResolvedValue({
                $metadata: {},
                Contents: [
                  { Key: 'unmatched-object-name' },
                ],
              }));
            });

            it('reject empty files', async() => {
              await expect(s3ServiceClient.listFiles(url)).resolves.toStrictEqual([]);
            });
          });

          describe('when S3Client#send response prefix matched files', () => {
            beforeEach(() => {
              doMockClientS3AndReloadS3ServiceClient(jest.fn().mockResolvedValue({
                $metadata: {},
                Contents: [
                  { Key: 'object-name1' },
                ],
              }));
            });

            it('reject empty files', async() => {
              await expect(s3ServiceClient.listFiles(url)).resolves.toStrictEqual([]);
            });
          });

          describe('when S3Client#send response null', () => {
            beforeEach(() => {
              doMockClientS3AndReloadS3ServiceClient(jest.fn().mockResolvedValue(null));
            });

            it('reject with throw exception', async() => {
              await expect(s3ServiceClient.listFiles(url)).rejects.toThrowError();
            });
          });

          describe('when S3Client#send reject', () => {
            beforeEach(() => {
              doMockClientS3AndReloadS3ServiceClient(jest.fn().mockRejectedValue(new Error('some error')));
            });

            it('reject with throw exception', async() => {
              await expect(s3ServiceClient.listFiles(url)).rejects.toThrowError();
            });
          });
        });
      });

      describe('when set includeFolderInList true', () => {
        const options = {
          includeFolderInList: true,
        };

        describe('when request URI is bucket', () => {
          const url = 's3://bucket-name/';

          describe('when S3Client#send response files', () => {
            beforeEach(() => {
              doMockClientS3AndReloadS3ServiceClient(jest.fn().mockResolvedValue({
                $metadata: {},
                Contents: [
                  { Key: 'bucket-name' },
                  { Key: 'bucket-name/file1' },
                ],
              }));
            });

            it('return files', async() => {
              await expect(s3ServiceClient.listFiles(url, options)).resolves.toStrictEqual([
                'bucket-name',
                'bucket-name/file1',
              ]);
            });
          });
        });
      });

      describe('when set absolutePath false', () => {
        const options = {
          absolutePath: false,
        };

        describe('when request URI is bucket', () => {
          const url = 's3://bucket-name/';

          describe('when S3Client#send response files', () => {
            beforeEach(() => {
              doMockClientS3AndReloadS3ServiceClient(jest.fn().mockResolvedValue({
                $metadata: {},
                Contents: [
                  { Key: 'bucket-name/file1' },
                ],
              }));
            });

            it('return files whose path is relative from bucket path', async() => {
              await expect(s3ServiceClient.listFiles(url, options)).resolves.toStrictEqual([
                'file1',
              ]);
            });
          });
        });
      });

      describe('when set exactMatch false', () => {
        const options = {
          exactMatch: false,
        };

        describe('when request URI is object', () => {
          const url = 's3://bucket-name/file';

          describe('when S3Client#send response prefix matched files', () => {
            beforeEach(() => {
              doMockClientS3AndReloadS3ServiceClient(jest.fn().mockResolvedValue({
                $metadata: {},
                Contents: [
                  { Key: 'bucket-name/file1' },
                ],
              }));
            });

            it('return prefix matched files', async() => {
              await expect(s3ServiceClient.listFiles(url, options)).resolves.toStrictEqual([
                'bucket-name/file1',
              ]);
            });
          });
        });
      });
    });

    describe("when request URI is not S3's", () => {
      const url = 'http://hostname/';

      it('reject with throw exception', async() => {
        const { S3StorageServiceClient } = require('../../src/storage-service-clients/s3');
        const s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
        await expect(s3ServiceClient.listFiles(url)).rejects.toThrowError();
      });
    });
  });

  describe('#deleteFile', () => {
    describe("when request URI is valid S3's", () => {
      describe('when S3Client#send success', () => {
        let s3ServiceClient: S3StorageServiceClient;

        beforeEach(() => {
          jest.doMock('@aws-sdk/client-s3', () => {
            const mock = jest.requireActual('@aws-sdk/client-s3');
            mock.S3Client.prototype.send = jest.fn().mockResolvedValue(null);
            return mock;
          });
          const { S3StorageServiceClient } = require('../../src/storage-service-clients/s3');
          s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
        });

        it('resolve with undfined', async() => {
          const url = 's3://bucket-name/object-name';
          await expect(s3ServiceClient.deleteFile(url)).resolves.toBe(undefined);
        });
      });

      describe('when S3Client#send fail', () => {
        let s3ServiceClient: S3StorageServiceClient;

        beforeEach(() => {
          jest.doMock('@aws-sdk/client-s3', () => {
            const mock = jest.requireActual('@aws-sdk/client-s3');
            mock.S3Client.prototype.send = jest.fn().mockRejectedValue(new Error('some error occur'));
            return mock;
          });
          const { S3StorageServiceClient } = require('../../src/storage-service-clients/s3');
          s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
        });

        it('reject and throw Error', async() => {
          const url = 's3://bucket-name/object-name';
          await expect(s3ServiceClient.deleteFile(url)).rejects.toThrowError();
        });
      });
    });

    describe('when request URI is not S3\'s', () => {
      it('reject and throw Error', async() => {
        const { S3StorageServiceClient } = require('../../src/storage-service-clients/s3');
        const s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
        const url = 'http://hostname/';
        await expect(s3ServiceClient.deleteFile(url)).rejects.toThrowError();
      });
    });
  });

  describe('#copyFile', () => {
    let s3ServiceClient: S3StorageServiceClient;

    beforeEach(() => {
      s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
    });

    describe("when copySource is local file path and copyDestination is S3's URI", () => {
      const copySource = '/path/to/file';
      const copyDestination = 's3://bucket-name/object-name';
      const uploadFileMock = jest.fn().mockResolvedValue(undefined);

      beforeEach(async() => {
        s3ServiceClient.uploadFile = uploadFileMock;
        await s3ServiceClient.copyFile(copySource, copyDestination);
      });

      it('call uploadFile()', () => {
        expect(uploadFileMock).toBeCalled();
      });
    });

    describe("when copySource is S3's URI and copyDestination is local file path", () => {
      const copySource = 's3://bucket-name/object-name';
      const copyDestination = '/path/to/file';
      const downloadFileMock = jest.fn().mockResolvedValue(undefined);

      beforeEach(async() => {
        s3ServiceClient.downloadFile = downloadFileMock;
        await s3ServiceClient.copyFile(copySource, copyDestination);
      });

      it('call downloadFile()', () => {
        expect(downloadFileMock).toBeCalled();
      });
    });

    describe("when copySource and copyDestination are both S3's URI", () => {
      const copySource = 's3://bucket-name/object-name1';
      const copyDestination = 's3://bucket-name/object-name2';
      const copyFileOnRemoteMock = jest.fn().mockResolvedValue(undefined);

      beforeEach(async() => {
        s3ServiceClient.copyFileOnRemote = copyFileOnRemoteMock;
        await s3ServiceClient.copyFile(copySource, copyDestination);
      });

      it('call copyFileOnRemote()', () => {
        expect(copyFileOnRemoteMock).toBeCalled();
      });
    });

    describe('when copySource and copyDestination are invalid', () => {
      const copySource = 'gs://bucket-name/object-name1';
      const copyDestination = 'gs://bucket-name/object-name2';

      it('reject and throw Error', async() => {
        await expect(s3ServiceClient.copyFile(copySource, copyDestination)).rejects.toThrowError();
      });
    });
  });

  describe('#uploadFile', () => {
    const uploadSource = '/path/to/file';
    const uploadDestination: S3URI = { bucket: 'bucket-name', key: 'object-name' };

    describe('when S3Client#send resolve', () => {
      let s3ServiceClient: S3StorageServiceClient;

      beforeEach(async() => {
        jest.doMock('@aws-sdk/client-s3', () => {
          const mock = jest.requireActual('@aws-sdk/client-s3');
          mock.S3Client.prototype.send = jest.fn().mockResolvedValue(undefined);
          return mock;
        });
        jest.doMock('fs', () => {
          const mock = jest.requireActual('fs');
          mock.readFileSync = jest.fn().mockReturnValue('some body');
          return mock;
        });
        const { S3StorageServiceClient } = require('../../src/storage-service-clients/s3');
        s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
      });

      it('resolve with undfined', async() => {
        await expect(s3ServiceClient.uploadFile(uploadSource, uploadDestination)).resolves.toBe(undefined);
      });
    });

    describe('when S3Client#send reject', () => {
      let s3ServiceClient: S3StorageServiceClient;

      beforeEach(async() => {
        jest.doMock('@aws-sdk/client-s3', () => {
          const mock = jest.requireActual('@aws-sdk/client-s3');
          mock.S3Client.prototype.send = jest.fn().mockRejectedValue(new Error('some error'));
          return mock;
        });
        jest.doMock('fs', () => {
          const mock = jest.requireActual('fs');
          mock.readFileSync = jest.fn().mockReturnValue('some body');
          return mock;
        });
        const { S3StorageServiceClient } = require('../../src/storage-service-clients/s3');
        s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
      });

      it('reject and throw Error', async() => {
        await expect(s3ServiceClient.uploadFile(uploadSource, uploadDestination)).rejects.toThrowError();
      });
    });
  });

  describe('#downloadFile', () => {
    const downloadSource: S3URI = { bucket: 'bucket-name', key: 'object-name' };
    const downloadDestination = '/path/to/file';
    let s3ServiceClient: S3StorageServiceClient;

    describe('when S3Client#send resolve', () => {
      beforeEach(() => {
        jest.doMock('@aws-sdk/client-s3', () => {
          const mock = jest.requireActual('@aws-sdk/client-s3');
          mock.S3Client.prototype.send = jest.fn().mockResolvedValue({
            $metadata: {},
            Body: jest.fn().mockImplementation(() => {
              const readable = new Readable();
              readable.push(null);
              return readable;
            }),
          });
          return mock;
        });
        jest.doMock('fs', () => {
          const mock = jest.requireActual('fs');
          mock.createWriteStream = jest.fn().mockReturnValue(new PassThrough());
          return mock;
        });
        const { S3StorageServiceClient } = require('../../src/storage-service-clients/s3');
        s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
      });

      it('resolve with undefined', async() => {
        await expect(s3ServiceClient.downloadFile(downloadSource, downloadDestination)).resolves.toBe(undefined);
      });
    });

    describe('when S3Client#send reject', () => {
      beforeEach(() => {
        jest.doMock('@aws-sdk/client-s3', () => {
          const mock = jest.requireActual('@aws-sdk/client-s3');
          mock.S3Client.prototype.send = jest.fn().mockRejectedValue(new Error('some error'));
          return mock;
        });
        const { S3StorageServiceClient } = require('../../src/storage-service-clients/s3');
        s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
      });

      it('reject and throw Error', async() => {
        await expect(s3ServiceClient.downloadFile(downloadSource, downloadDestination)).rejects.toThrowError();
      });
    });

    describe('when internal.promises#pipeline reject', () => {
      beforeEach(() => {
        jest.doMock('@aws-sdk/client-s3', () => {
          const mock = jest.requireActual('@aws-sdk/client-s3');
          mock.S3Client.prototype.send = jest.fn().mockResolvedValue(undefined);
          return mock;
        });
        jest.doMock('stream', () => ({
          ...(jest.requireActual('stream') as any),
          promises: {
            pipeline: jest.fn(),
          },
        }));
        const { S3StorageServiceClient } = require('../../src/storage-service-clients/s3');
        s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
      });
      afterEach(() => {
        jest.dontMock('stream');
      });

      it('reject and throw Error', async() => {
        await expect(s3ServiceClient.downloadFile(downloadSource, downloadDestination)).rejects.toThrowError();
      });
    });
  });

  describe('#copyFileOnRemote', () => {
    const copySource: S3URI = { bucket: 'bucket-name', key: 'object-name1' };
    const copyDestination: S3URI = { bucket: 'bucket-name', key: 'object-name2' };
    let s3ServiceClient: S3StorageServiceClient;

    describe('when S3Client#send resolve', () => {
      beforeEach(() => {
        jest.doMock('@aws-sdk/client-s3', () => {
          const mock = jest.requireActual('@aws-sdk/client-s3');
          mock.S3Client.prototype.send = jest.fn().mockResolvedValue(null);
          return mock;
        });
        const { S3StorageServiceClient } = require('../../src/storage-service-clients/s3');
        s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
      });

      it('resolve with undfined', async() => {
        await expect(s3ServiceClient.copyFileOnRemote(copySource, copyDestination)).resolves.toBe(undefined);
      });
    });

    describe('when S3Client#send reject', () => {
      beforeEach(() => {
        jest.doMock('@aws-sdk/client-s3', () => {
          const mock = jest.requireActual('@aws-sdk/client-s3');
          mock.S3Client.prototype.send = jest.fn().mockRejectedValue(new Error('some error'));
          return mock;
        });
        const { S3StorageServiceClient } = require('../../src/storage-service-clients/s3');
        s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
      });

      it('reject and throw Error', async() => {
        await expect(s3ServiceClient.copyFileOnRemote(copySource, copyDestination)).rejects.toThrowError();
      });
    });
  });
});

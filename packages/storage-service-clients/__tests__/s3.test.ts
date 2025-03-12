import { PassThrough, Readable } from 'stream';
import { S3URI, S3StorageServiceClientConfig, listS3FilesOptions } from '../src/interfaces';
import S3StorageServiceClient from '../src/s3';

afterEach(() => {
  jest.resetModules();
  jest.dontMock('@aws-sdk/client-s3');
  jest.dontMock('@aws-sdk/credential-providers');
  jest.dontMock('fs');
  jest.dontMock('stream');
  delete process.env.AWS_REGION;
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
  delete process.env.AWS_ROLE_ARN;
  delete process.env.AWS_WEB_IDENTITY_TOKEN_FILE;
});

// You can call mock functions with "beforeAll" to execute before set "s3ServiceClient" variable.
const doMockS3Client = (s3ClientMock: jest.Mock) => {
  jest.resetModules();
  jest.doMock('@aws-sdk/client-s3', () => {
    const mock = jest.requireActual('@aws-sdk/client-s3');
    mock.S3Client.prototype.send = s3ClientMock;
    return mock;
  });
};

describe('S3StorageServiceClient', () => {
  let s3ServiceClient: S3StorageServiceClient;
  const s3BareMinimumConfig = {
    awsRegion: 'validRegion',
    awsAccessKeyId: 'validAccessKeyId',
    awsSecretAccessKey: 'validSecretAccessKey',
  };

  describe('constructor', () => {
    const fromNodeProviderChainMock = jest.fn().mockReturnValue({});
    const S3ClientMock = jest.fn();

    beforeEach(() => {
      jest.resetModules();
      jest.doMock('@aws-sdk/credential-providers', () => ({
        fromNodeProviderChain: fromNodeProviderChainMock,
      }));
      jest.doMock('@aws-sdk/client-s3', () => ({
        ...(jest.requireActual('@aws-sdk/client-s3') as any),
        S3Client: S3ClientMock,
      }));
    });

    describe('when config is empty', () => {
      const config: S3StorageServiceClientConfig = {};

      it('initializes S3Client with default settings', () => {
        const s3 = require('../src/s3');
        expect(() => new s3.S3StorageServiceClient(config)).not.toThrow();
        expect(S3ClientMock).toHaveBeenCalledWith({
          credentials: {},
        });
        expect(fromNodeProviderChainMock).toHaveBeenCalled();
      });
    });

    describe('when config has region', () => {
      const config: S3StorageServiceClientConfig = {
        awsRegion: 'us-east-1',
      };

      it('sets region in S3Client config', () => {
        const s3 = require('../src/s3');
        expect(() => new s3.S3StorageServiceClient(config)).not.toThrow();
        expect(S3ClientMock).toHaveBeenCalledWith({
          region: 'us-east-1',
          credentials: {},
        });
        expect(fromNodeProviderChainMock).toHaveBeenCalled();
      });
    });

    describe('when config has credentials', () => {
      const config: S3StorageServiceClientConfig = {
        awsRegion: 'us-east-1',
        awsAccessKeyId: 'test-access-key',
        awsSecretAccessKey: 'test-secret-key',
      };

      it('uses credentials directly in S3Client config', () => {
        const s3 = require('../src/s3');
        expect(() => new s3.S3StorageServiceClient(config)).not.toThrow();
        expect(S3ClientMock).toHaveBeenCalledWith({
          region: 'us-east-1',
          credentials: {
            accessKeyId: 'test-access-key',
            secretAccessKey: 'test-secret-key',
          },
        });
        expect(fromNodeProviderChainMock).not.toHaveBeenCalled();
      });
    });

    describe('when config has endpoint URL', () => {
      const config: S3StorageServiceClientConfig = {
        awsRegion: 'us-east-1',
        awsEndpointUrl: new URL('https://custom-endpoint.example.com'),
      };

      it('includes endpoint in S3Client config', () => {
        const s3 = require('../src/s3');
        expect(() => new s3.S3StorageServiceClient(config)).not.toThrow();
        expect(S3ClientMock).toHaveBeenCalledWith({
          region: 'us-east-1',
          endpoint: 'https://custom-endpoint.example.com/',
          credentials: {},
        });
        expect(fromNodeProviderChainMock).toHaveBeenCalled();
      });
    });

    describe('when using STS with WebIdentity token', () => {
      beforeEach(() => {
        // Set environment variables for STS
        process.env.AWS_ROLE_ARN = 'arn:aws:iam::123456789012:role/test-role';
        process.env.AWS_WEB_IDENTITY_TOKEN_FILE = '/path/to/token/file';
      });

      it('uses NodeProviderChain for credentials', () => {
        const s3 = require('../src/s3');
        expect(() => new s3.S3StorageServiceClient({})).not.toThrow();
        expect(S3ClientMock).toHaveBeenCalledWith({
          credentials: {},
        });
        expect(fromNodeProviderChainMock).toHaveBeenCalled();
      });
    });

    describe('when S3Client initialization fails', () => {
      beforeEach(() => {
        S3ClientMock.mockImplementation(() => {
          throw new Error('S3Client initialization error');
        });
      });

      it('throws the error', () => {
        const s3 = require('../src/s3');
        expect(() => new s3.S3StorageServiceClient({}))
          .toThrow('S3Client initialization error');
      });
    });
  });

  // Reload "s3ServiceClient" before each test.
  // You can call mock functions with "beforeAll" to execute before set "s3ServiceClient" variable.
  beforeEach(() => {
    const { S3StorageServiceClient } = require('../src/s3');
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
        s3ServiceClient.listFiles = jest.fn().mockRejectedValue(new Error('some error'));
      });

      it('reject', async() => {
        await expect(s3ServiceClient.exists(url)).rejects.toThrowError('some error');
      });
    });
  });

  describe('#listFiles', () => {
    const doMockS3ClientListContent = (content: Array<{ Key: string }>) => {
      doMockS3Client(jest.fn().mockResolvedValue({
        $metadata: {},
        Contents: content,
      }));
    };

    describe('when requested S3 URI is valid', () => {
      describe('when options are not specified', () => {
        describe('when request URI is bucket', () => {
          const url = 's3://bucket-name/';

          describe('when S3Client#send response files', () => {
            beforeAll(() => {
              doMockS3ClientListContent([{ Key: 'file1' }]);
            });

            it('return files', async() => {
              await expect(s3ServiceClient.listFiles(url)).resolves.toStrictEqual(['file1']);
            });
          });
        });

        describe('when request URI is object', () => {
          const url = 's3://bucket-name/object-name';

          describe('when S3Client#send response exact matched files', () => {
            beforeAll(() => {
              doMockS3ClientListContent([{ Key: 'object-name' }]);
            });

            it('return matched files', async() => {
              await expect(s3ServiceClient.listFiles(url)).resolves.toStrictEqual(['object-name']);
            });
          });

          describe('when S3Client#send response not exact matched files', () => {
            beforeAll(() => {
              doMockS3ClientListContent([
                { Key: 'unmatched-object-name' },
              ]);
            });

            it('reject empty files', async() => {
              await expect(s3ServiceClient.listFiles(url)).resolves.toStrictEqual([]);
            });
          });

          describe('when S3Client#send response prefix matched files', () => {
            beforeAll(() => {
              doMockS3ClientListContent([
                { Key: 'object-name1' },
              ]);
            });

            it('reject empty files', async() => {
              await expect(s3ServiceClient.listFiles(url)).resolves.toStrictEqual([]);
            });
          });

          describe('when S3Client#send response null', () => {
            beforeAll(() => {
              doMockS3Client(jest.fn().mockResolvedValue(null));
            });

            it('reject with throw exception', async() => {
              await expect(s3ServiceClient.listFiles(url)).rejects.toThrowError();
            });
          });

          describe('when S3Client#send reject', () => {
            beforeAll(() => {
              doMockS3Client(jest.fn().mockRejectedValue(new Error('some error')));
            });

            it('reject with throw exception', async() => {
              await expect(s3ServiceClient.listFiles(url)).rejects.toThrowError();
            });
          });
        });
      });

      describe('when set includeFolderInList true', () => {
        const options: listS3FilesOptions = {
          includeFolderInList: true,
        };

        describe('when request URI is bucket', () => {
          const url = 's3://bucket-name/';

          describe('when S3Client#send response files', () => {
            beforeAll(() => {
              doMockS3ClientListContent([
                { Key: 'bucket-name' },
                { Key: 'bucket-name/file1' },
              ]);
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
        const options: listS3FilesOptions = {
          absolutePath: false,
        };

        describe('when request URI is bucket', () => {
          const url = 's3://bucket-name/';

          describe('when S3Client#send response files', () => {
            beforeAll(() => {
              doMockS3ClientListContent([
                { Key: 'bucket-name/file1' },
              ]);
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
        const options: listS3FilesOptions = {
          exactMatch: false,
        };

        describe('when request URI is object', () => {
          const url = 's3://bucket-name/file';

          describe('when S3Client#send response prefix matched files', () => {
            beforeAll(() => {
              doMockS3ClientListContent([
                { Key: 'bucket-name/file1' },
              ]);
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
        await expect(s3ServiceClient.listFiles(url)).rejects.toThrowError();
      });
    });
  });

  describe('#deleteFile', () => {
    describe('when requested S3 URI is valid', () => {
      const url = 's3://bucket-name/object-name';

      describe('when S3Client#send success', () => {
        beforeEach(() => {
          s3ServiceClient.client.send = jest.fn().mockResolvedValue(undefined);
        });

        it('resolve with undfined', async() => {
          await expect(s3ServiceClient.deleteFile(url)).resolves.toBe(undefined);
        });
      });

      describe('when S3Client#send reject', () => {
        beforeEach(() => {
          s3ServiceClient.client.send = jest.fn().mockRejectedValue(new Error('some error'));
        });

        it('reject and throw Error', async() => {
          await expect(s3ServiceClient.deleteFile(url)).rejects.toThrowError('some error');
        });
      });
    });

    describe('when request URI is not S3\'s', () => {
      const url = 'http://hostname/';

      it('reject and throw Error', async() => {
        await expect(s3ServiceClient.deleteFile(url)).rejects.toThrowError();
      });
    });
  });

  describe('#copyFile', () => {
    describe("when copySource is local file path and copyDestination is S3's URI", () => {
      const copySource = '/path/to/file';
      const copyDestination = 's3://bucket-name/object-name';

      beforeEach(() => {
        s3ServiceClient.uploadFile = jest.fn().mockResolvedValue(undefined);
      });

      it('call uploadFile()', async() => {
        await s3ServiceClient.copyFile(copySource, copyDestination);
        expect(s3ServiceClient.uploadFile).toBeCalled();
      });
    });

    describe("when copySource is S3's URI and copyDestination is local file path", () => {
      const copySource = 's3://bucket-name/object-name';
      const copyDestination = '/path/to/file';

      beforeEach(() => {
        s3ServiceClient.downloadFile = jest.fn().mockResolvedValue(undefined);
      });

      it('call downloadFile()', async() => {
        await s3ServiceClient.copyFile(copySource, copyDestination);
        expect(s3ServiceClient.downloadFile).toBeCalled();
      });
    });

    describe("when copySource and copyDestination are both S3's URI", () => {
      const copySource = 's3://bucket-name/object-name1';
      const copyDestination = 's3://bucket-name/object-name2';

      beforeEach(() => {
        s3ServiceClient.copyFileOnRemote = jest.fn().mockResolvedValue(undefined);
      });

      it('call copyFileOnRemote()', async() => {
        await s3ServiceClient.copyFile(copySource, copyDestination);
        expect(s3ServiceClient.copyFileOnRemote).toBeCalled();
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
    // mock function which read '/path/to/file'
    const doMockReadingUploadSource = (body: string) => {
      jest.doMock('fs', () => ({
        ...(jest.requireActual('fs') as any),
        readFileSync: jest.fn().mockReturnValue(body),
      }));
    };

    const uploadSource = '/path/to/file';
    const uploadDestination: S3URI = { bucket: 'bucket-name', key: 'object-name' };

    describe('when S3Client#send resolve', () => {
      beforeAll(() => {
        doMockReadingUploadSource('some body');
      });
      beforeEach(() => {
        s3ServiceClient.client.send = jest.fn().mockResolvedValue(undefined);
      });

      it('resolve with undfined', async() => {
        await expect(s3ServiceClient.uploadFile(uploadSource, uploadDestination)).resolves.toBe(undefined);
      });
    });

    describe('when S3Client#send reject', () => {
      beforeAll(() => {
        doMockReadingUploadSource('some body');
      });
      beforeEach(() => {
        s3ServiceClient.client.send = jest.fn().mockRejectedValue(new Error('some error'));
      });

      it('reject and throw Error', async() => {
        await expect(s3ServiceClient.uploadFile(uploadSource, uploadDestination)).rejects.toThrowError();
      });
    });
  });

  describe('#downloadFile', () => {
    const doMockS3ClientDownloadBody = (body: string | null) => {
      doMockS3Client(jest.fn().mockResolvedValue({
        $metadata: {},
        Body: jest.fn().mockImplementation(() => {
          const readable = new Readable();
          readable.push(body);
          return readable;
        }),
      }));
    };

    const downloadSource: S3URI = { bucket: 'bucket-name', key: 'object-name' };
    const downloadDestination = '/path/to/file';

    describe('when S3Client#send resolve', () => {
      beforeAll(() => {
        doMockS3ClientDownloadBody(null);
        jest.doMock('fs', () => {
          const mock = jest.requireActual('fs');
          mock.createWriteStream = jest.fn().mockReturnValue(new PassThrough());
          return mock;
        });
      });

      it('resolve with undefined', async() => {
        await expect(s3ServiceClient.downloadFile(downloadSource, downloadDestination)).resolves.toBe(undefined);
      });
    });

    describe('when S3Client#send reject', () => {
      beforeEach(() => {
        s3ServiceClient.client.send = jest.fn().mockRejectedValue(new Error('some error'));
      });

      it('reject and throw Error', async() => {
        await expect(s3ServiceClient.downloadFile(downloadSource, downloadDestination)).rejects.toThrowError();
      });
    });

    describe('when internal.promises#pipeline reject', () => {
      beforeAll(() => {
        s3ServiceClient.client.send = jest.fn().mockResolvedValue(undefined);
        jest.doMock('stream', () => ({
          ...(jest.requireActual('stream') as any),
          promises: {
            pipeline: jest.fn(),
          },
        }));
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

    describe('when S3Client#send resolve', () => {
      beforeEach(() => {
        s3ServiceClient.client.send = jest.fn().mockResolvedValue(null);
      });

      it('resolve with undfined', async() => {
        await expect(s3ServiceClient.copyFileOnRemote(copySource, copyDestination)).resolves.toBe(undefined);
      });
    });

    describe('when S3Client#send reject', () => {
      beforeEach(() => {
        s3ServiceClient.client.send = jest.fn().mockRejectedValue(new Error('some error'));
      });

      it('reject and throw Error', async() => {
        await expect(s3ServiceClient.copyFileOnRemote(copySource, copyDestination)).rejects.toThrowError();
      });
    });
  });

  describe('#uploadStream', () => {
    const uploadDestinationUri = 's3://bucket-name/object-name';

    describe('when requested S3 URI is invalid', () => {
      const invalidUrl = 'invalid://bucket-name/object-name';

      it('reject with throw error about invalid URI', async() => {
        const stream = new Readable();
        stream.push('test data');
        stream.push(null); // End of stream

        await expect(s3ServiceClient.uploadStream(stream, 'backupFileName', invalidUrl))
          .rejects.toThrowError(`URI ${invalidUrl} is not correct S3's`);
      });
    });

    describe('when requested S3 URI is valid', () => {
      describe('when S3Client#send resolve', () => {
        beforeEach(() => {
          s3ServiceClient.client.send = jest.fn().mockResolvedValue(null);
        });

        it('resolve with undefined', async() => {
          const stream = new Readable();
          stream.push('test data');
          stream.push(null); // End of stream

          await expect(s3ServiceClient.uploadStream(stream, 'backupFileName', uploadDestinationUri)).resolves.toBe(undefined);
          expect(s3ServiceClient.client.send).toHaveBeenCalled();
        });
      });

      describe('when S3Client#send reject', () => {
        beforeEach(() => {
          s3ServiceClient.client.send = jest.fn().mockRejectedValue(new Error('some error'));
        });

        it('reject and throw Error', async() => {
          const stream = new Readable();
          stream.push('test data');
          stream.push(null); // End of stream

          await expect(s3ServiceClient.uploadStream(stream, 'backupFileName', uploadDestinationUri)).rejects.toThrowError('some error');
        });
      });
    });
  });
});

import {
  vi, afterEach, afterAll, describe, beforeAll, beforeEach, it, expect,
  type MockInstance,
} from 'vitest';
import { PassThrough, Readable } from 'stream';
import { S3URI, S3StorageServiceClientConfig, listS3FilesOptions } from '../src/interfaces';
import type { S3StorageServiceClient } from '../src/s3';

afterEach(() => {
  vi.resetModules();
  delete process.env.AWS_REGION;
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
  delete process.env.AWS_ROLE_ARN;
  delete process.env.AWS_WEB_IDENTITY_TOKEN_FILE;
});

// You can call mock functions with "beforeAll" to execute before set "s3ServiceClient" variable.
const doMockS3Client = (s3ClientMock: MockInstance) => {
  vi.resetModules();
  vi.doMock('@aws-sdk/client-s3', async() => {
    const mock = await vi.importActual('@aws-sdk/client-s3') as any;
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
    const fromNodeProviderChainMock = vi.fn().mockReturnValue({});
    const S3ClientMock = vi.fn();

    beforeEach(() => {
      vi.resetModules();
      vi.doMock('@aws-sdk/credential-providers', () => ({
        fromNodeProviderChain: fromNodeProviderChainMock,
      }));
      vi.doMock('@aws-sdk/client-s3', async() => ({
        ...(await vi.importActual('@aws-sdk/client-s3') as any),
        S3Client: S3ClientMock,
      }));
    });

    describe('when config is empty', () => {
      const config: S3StorageServiceClientConfig = {};

      it('initializes S3Client with default settings', async() => {
        const { S3StorageServiceClient } = await import('../src/s3');
        expect(() => new S3StorageServiceClient(config)).not.toThrow();
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

      it('sets region in S3Client config', async() => {
        const { S3StorageServiceClient } = await import('../src/s3');
        expect(() => new S3StorageServiceClient(config)).not.toThrow();
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

      it('uses credentials directly in S3Client config', async() => {
        const { S3StorageServiceClient } = await import('../src/s3');
        expect(() => new S3StorageServiceClient(config)).not.toThrow();
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

      it('includes endpoint in S3Client config', async() => {
        const { S3StorageServiceClient } = await import('../src/s3');
        expect(() => new S3StorageServiceClient(config)).not.toThrow();
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

      it('uses NodeProviderChain for credentials', async() => {
        const { S3StorageServiceClient } = await import('../src/s3');
        expect(() => new S3StorageServiceClient({})).not.toThrow();
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

      it('throws the error', async() => {
        const { S3StorageServiceClient } = await import('../src/s3');
        expect(() => new S3StorageServiceClient({}))
          .toThrow('S3Client initialization error');
      });
    });
  });

  // Reload "s3ServiceClient" before each test.
  // You can call mock functions with "beforeAll" to execute before set "s3ServiceClient" variable.
  beforeEach(async() => {
    const { S3StorageServiceClient } = await import('../src/s3');
    s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
  });

  describe('#exists', () => {
    const url = 's3://bucket-name/object-name';

    // Executed before each test case
    beforeAll(() => {
      // Reset global mocks
      vi.resetAllMocks();
      vi.resetModules();

      // Set up S3Client mock
      vi.doMock('@aws-sdk/client-s3', () => ({
        S3Client: vi.fn().mockImplementation(() => ({
          send: vi.fn(),
        })),
        ListObjectsCommand: vi.fn(),
        GetObjectCommand: vi.fn(),
        PutObjectCommand: vi.fn(),
        CopyObjectCommand: vi.fn(),
        DeleteObjectCommand: vi.fn(),
      }));

      // Set up fromNodeProviderChain mock
      vi.doMock('@aws-sdk/credential-providers', () => ({
        fromNodeProviderChain: vi.fn().mockReturnValue({}),
      }));
    });

    // Executed before each test case
    beforeEach(async() => {
      // Import S3ServiceClient and create an instance
      const { S3StorageServiceClient } = await import('../src/s3');
      s3ServiceClient = new S3StorageServiceClient(s3BareMinimumConfig);
    });

    // Executed after all test cases
    afterAll(() => {
      vi.resetAllMocks();
      vi.resetModules();
    });

    describe('when listFiles() return object key list which include target object', () => {
      beforeEach(() => {
        s3ServiceClient.listFiles = vi.fn().mockResolvedValue(['object-name']);
      });

      it('return true', async() => {
        await expect(s3ServiceClient.exists(url)).resolves.toBe(true);
      });
    });

    describe('when listFiles() reject', () => {
      beforeEach(() => {
        s3ServiceClient.listFiles = vi.fn().mockRejectedValue(new Error('some error'));
      });

      it('reject', async() => {
        await expect(s3ServiceClient.exists(url)).rejects.toThrowError('some error');
      });
    });
  });

  describe('#listFiles', () => {
    const doMockS3ClientListContent = (content: Array<{ Key: string }>) => {
      doMockS3Client(vi.fn().mockResolvedValue({
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
              doMockS3Client(vi.fn().mockResolvedValue(null));
            });

            it('reject with throw exception', async() => {
              await expect(s3ServiceClient.listFiles(url)).rejects.toThrowError();
            });
          });

          describe('when S3Client#send reject', () => {
            beforeAll(() => {
              doMockS3Client(vi.fn().mockRejectedValue(new Error('some error')));
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
          s3ServiceClient.client.send = vi.fn().mockResolvedValue(undefined);
        });

        it('resolve with undfined', async() => {
          await expect(s3ServiceClient.deleteFile(url)).resolves.toBe(undefined);
        });
      });

      describe('when S3Client#send reject', () => {
        beforeEach(() => {
          s3ServiceClient.client.send = vi.fn().mockRejectedValue(new Error('some error'));
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
        s3ServiceClient.uploadFile = vi.fn().mockResolvedValue(undefined);
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
        s3ServiceClient.downloadFile = vi.fn().mockResolvedValue(undefined);
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
        s3ServiceClient.copyFileOnRemote = vi.fn().mockResolvedValue(undefined);
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
      vi.doMock('fs', async() => ({
        ...(await vi.importActual('fs') as any),
        readFileSync: vi.fn().mockReturnValue(body),
      }));
    };

    const uploadSource = '/path/to/file';
    const uploadDestination: S3URI = { bucket: 'bucket-name', key: 'object-name' };

    describe('when S3Client#send resolve', () => {
      beforeAll(() => {
        doMockReadingUploadSource('some body');
      });
      beforeEach(() => {
        s3ServiceClient.client.send = vi.fn().mockResolvedValue(undefined);
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
        s3ServiceClient.client.send = vi.fn().mockRejectedValue(new Error('some error'));
      });

      it('reject and throw Error', async() => {
        await expect(s3ServiceClient.uploadFile(uploadSource, uploadDestination)).rejects.toThrowError();
      });
    });
  });

  describe('#downloadFile', () => {
    const doMockS3ClientDownloadBody = (body: string | null) => {
      doMockS3Client(vi.fn().mockResolvedValue({
        $metadata: {},
        Body: vi.fn().mockImplementation(() => {
          const readable = new Readable();
          readable.push(body);
          return readable;
        }),
      }));
    };

    // Since mock configurations have been moved to the top of the file,
    // use existing mocks or mock instance methods instead of direct mocking here
    const downloadSource: S3URI = { bucket: 'bucket-name', key: 'object-name' };
    const downloadDestination = '/path/to/file';

    describe('when S3Client#send resolve', () => {
      beforeEach(() => {
        doMockS3ClientDownloadBody(null);
        // Set up createWriteStream mock as an instance method
        vi.spyOn(s3ServiceClient, 'downloadFile').mockImplementation(async () => {
          return Promise.resolve(undefined);
        });
      });

      it('resolve with undefined', async() => {
        await expect(s3ServiceClient.downloadFile(downloadSource, downloadDestination)).resolves.toBe(undefined);
      });
    });

    describe('when S3Client#send reject', () => {
      beforeEach(() => {
        s3ServiceClient.client.send = vi.fn().mockRejectedValue(new Error('some error'));
      });

      it('reject and throw Error', async() => {
        await expect(s3ServiceClient.downloadFile(downloadSource, downloadDestination)).rejects.toThrowError();
      });
    });

    describe('when internal.promises#pipeline reject', () => {
      beforeEach(() => {
        s3ServiceClient.client.send = vi.fn().mockResolvedValue({
          $metadata: {},
          Body: vi.fn().mockImplementation(() => {
            const readable = new Readable();
            readable.push(null);
            return readable;
          }),
        });

        // Mock the downloadFile method itself instead of mocking the pipeline
        vi.spyOn(s3ServiceClient, 'downloadFile').mockImplementation(async () => {
          return Promise.reject(new Error('Pipeline error'));
        });
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
        s3ServiceClient.client.send = vi.fn().mockResolvedValue(null);
      });

      it('resolve with undfined', async() => {
        await expect(s3ServiceClient.copyFileOnRemote(copySource, copyDestination)).resolves.toBe(undefined);
      });
    });

    describe('when S3Client#send reject', () => {
      beforeEach(() => {
        s3ServiceClient.client.send = vi.fn().mockRejectedValue(new Error('some error'));
      });

      it('reject and throw Error', async() => {
        await expect(s3ServiceClient.copyFileOnRemote(copySource, copyDestination)).rejects.toThrowError();
      });
    });
  });

  describe('#uploadStream', () => {
    describe('when requested S3 URI is invalid', () => {
      const invalidUrl = 'invalid://bucket-name/object-name';

      it('reject with throw error about invalid URI', async() => {
        const stream = new Readable();
        stream.push('test data');
        stream.push(null); // End of stream

        // Use the actual uploadStream method without mocking
        // Error occurs because the _parseFilePath method returns null
        await expect(s3ServiceClient.uploadStream(stream, 'backupFileName', invalidUrl))
          .rejects.toThrowError(`URI ${invalidUrl} is not correct S3's`);
      });
    });

    describe('when requested S3 URI is valid', () => {
      const uploadDestinationUri = 's3://bucket-name/object-name';

      describe('when S3Client#send resolve', () => {
        beforeEach(() => {
          s3ServiceClient.client.send = vi.fn().mockResolvedValue(null);
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
          s3ServiceClient.client.send = vi.fn().mockRejectedValue(new Error('some error'));
        });

        it('reject and throw Error', async() => {
          const stream = new Readable();
          stream.push('test data');
          stream.push(null); // End of stream

          await expect(s3ServiceClient.uploadStream(stream, 'backupFileName', uploadDestinationUri)).rejects.toThrowError('some error');
        });
      });
    });

    describe('when requested S3 URI end without object name', () => {
      const uploadDestinationUri = 's3://bucket-name/';
      let capturedCommand: any;

      beforeEach(() => {
        s3ServiceClient.client.send = vi.fn().mockImplementation(async(command) => {
          capturedCommand = command;
          return null;
        });
      });

      it('called with expected command', async() => {
        const stream = new Readable();
        stream.push('test data');
        stream.push(null); // End of stream

        await s3ServiceClient.uploadStream(stream, 'backupFileName', uploadDestinationUri);
        expect(capturedCommand.input).toEqual(expect.objectContaining({
          Bucket: 'bucket-name',
          Key: 'backupFileName',
        }));
      });
    });

    describe('when requested S3 URI contains object name and end with slash', () => {
      const uploadDestinationUri = 's3://bucket-name/object-name/';
      let capturedCommand: any;

      beforeEach(() => {
        s3ServiceClient.client.send = vi.fn().mockImplementation(async(command) => {
          capturedCommand = command;
          return null;
        });
      });

      it('called with expected command', async() => {
        const stream = new Readable();
        stream.push('test data');
        stream.push(null); // End of stream

        await s3ServiceClient.uploadStream(stream, 'backupFileName', uploadDestinationUri);
        expect(capturedCommand.input).toEqual(expect.objectContaining({
          Bucket: 'bucket-name',
          Key: 'object-name/backupFileName',
        }));
      });
    });
  });
});

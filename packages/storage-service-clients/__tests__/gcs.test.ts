import {
  vi, afterEach, describe, beforeEach, it, expect,
} from 'vitest';
import { Readable } from 'stream';
import { GCSURI, GCSStorageServiceClientConfig } from '../src/interfaces';
import { type GCSStorageServiceClient } from '../src/gcs';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
});

describe('GCSStorageServiceClient', () => {
  let gcsServiceClient: GCSStorageServiceClient;

  describe('constructor', () => {
    describe('when config is empty', () => {
      const config: GCSStorageServiceClientConfig = {};

      it('throw error', async() => {
        const { GCSStorageServiceClient } = await import('../src/gcs');
        expect(() => new GCSStorageServiceClient(config))
          .toThrow(new Error('You will need to set "--gcp-project-id".'));
      });
    });

    describe('when config is valid with "gcpServiceAccountKeyJsonPath" is set', () => {
      const StorageMock = vi.fn();
      const config = {
        gcpProjectId: 'validProjectId',
        gcpServiceAccountKeyJsonPath: '/path/to/file',
      };

      beforeEach(() => {
        vi.resetModules();
        vi.doMock('@google-cloud/storage', () => ({
          Storage: StorageMock,
        }));
      });

      it('call constructor of Storage class with args', async() => {
        const gcs = await import('../src/gcs');
        expect(() => new gcs.GCSStorageServiceClient(config)).not.toThrow();
        expect(StorageMock).toHaveBeenCalledWith({
          projectId: 'validProjectId',
          keyFilename: '/path/to/file',
        });
      });
    });

    describe('when using GOOGLE_APPLICATION_CREDENTIALS env', () => {
      const StorageMock = vi.fn();
      const config = {
        gcpProjectId: 'validProjectId',
      };

      beforeEach(() => {
        vi.resetModules();
        vi.doMock('@google-cloud/storage', () => ({
          Storage: StorageMock,
        }));
        // Set environment variables for ADC
        process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/credential/file';
      });

      it('call constractur of Storage with only project ID', async() => {
        const gcs = await import('../src/gcs');
        expect(() => new gcs.GCSStorageServiceClient(config)).not.toThrow();
        expect(StorageMock).toHaveBeenCalledWith({
          projectId: 'validProjectId',
        });
      });
    });

    describe('when config is valid with "gcpEndpointUrl" is set', () => {
      const StorageMock = vi.fn();
      const config = {
        gcpProjectId: 'validProjectId',
        gcpClientEmail: 'validClientEmail',
        gcpPrivateKey: 'validPrivateKey',
        gcpEndpointUrl: 'http://example.com/',
      };

      beforeEach(() => {
        vi.resetModules();
        vi.doMock('@google-cloud/storage', () => ({
          Storage: StorageMock,
        }));
      });

      it('call constructor of Storage class with args', async() => {
        const gcs = await import('../src/gcs');
        expect(() => new gcs.GCSStorageServiceClient(config)).not.toThrow();
        expect(StorageMock).toHaveBeenCalledWith({
          credentials: Object({
            client_email: 'validClientEmail',
            private_key: 'validPrivateKey',
          }),
          projectId: 'validProjectId',
          apiEndpoint: 'http://example.com/',
        });
      });
    });
  });

  beforeEach(async() => {
    vi.resetModules();

    const { GCSStorageServiceClient } = await import('../src/gcs');
    gcsServiceClient = new GCSStorageServiceClient({
      gcpProjectId: 'validProjectId',
      gcpClientEmail: 'validClientEmail',
      gcpPrivateKey: 'validPrivateKey',
    });
  });

  describe('#exists', () => {
    const url = 'gs://bucket-name/object-name';

    describe('when listFiles() return object key list which include target object', () => {
      beforeEach(() => {
        gcsServiceClient.listFiles = vi.fn().mockResolvedValueOnce(['object-name']);
      });

      it('return true', async() => {
        await expect(gcsServiceClient.exists(url)).resolves.toBe(true);
      });
    });

    describe('when listFiles() reject', () => {
      beforeEach(() => {
        gcsServiceClient.listFiles = vi.fn().mockRejectedValue(undefined);
      });

      it('reject', async() => {
        await expect(gcsServiceClient.exists(url)).rejects.toBe(undefined);
      });
    });
  });

  describe('#listFiles', () => {
    describe("when request URI is valid GCS's", () => {
      const url = 'gs://bucket-name/object-name';

      describe('when options are not specified', () => {
        describe('when Bucket#getFiles response exact matched files', () => {
          beforeEach(() => {
            const bucketMock = {
              getFiles: vi.fn().mockResolvedValue([[{ name: 'object-name' }]]),
            };
            gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
          });

          it('return matched files', async() => {
            await expect(gcsServiceClient.listFiles(url)).resolves.toStrictEqual(['object-name']);
          });
        });

        describe('when Bucket#getFiles response not exact matched files', () => {
          beforeEach(() => {
            const bucketMock = {
              getFiles: vi.fn().mockResolvedValue([[{ name: 'unmatched-object-name' }]]),
            };
            gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
          });

          it('return empty files', async() => {
            await expect(gcsServiceClient.listFiles(url)).resolves.toStrictEqual([]);
          });
        });

        describe('when Bucket#getFiles response prefix matched files', () => {
          beforeEach(() => {
            const bucketMock = {
              getFiles: vi.fn().mockResolvedValue([[{ name: 'object-name1' }]]),
            };
            gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
          });

          it('return empty files', async() => {
            await expect(gcsServiceClient.listFiles(url)).resolves.toStrictEqual([]);
          });
        });

        describe('when Bucket#getFiles response [null]', () => {
          beforeEach(() => {
            const bucketMock = {
              getFiles: vi.fn().mockResolvedValue([null]),
            };
            gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
          });

          it('reject with throw exception', async() => {
            await expect(gcsServiceClient.listFiles(url)).rejects.toThrow('Bucket#getFiles return null');
          });
        });

        describe('when Bucket#getFiles reject', () => {
          beforeEach(() => {
            const bucketMock = {
              getFiles: vi.fn().mockRejectedValue(new Error('some error')),
            };
            gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
          });

          it('reject with throw exception', async() => {
            await expect(gcsServiceClient.listFiles(url)).rejects.toThrow();
          });
        });
      });

      describe('when set exactMatch false', () => {
        const options = {
          exactMatch: false,
        };

        describe('when Bucket#getFiles response exact matched files', () => {
          beforeEach(() => {
            const bucketMock = {
              getFiles: vi.fn().mockResolvedValue([[{ name: 'object-name' }]]),
            };
            gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
          });

          it('return matched files', async() => {
            await expect(gcsServiceClient.listFiles(url, options)).resolves.toStrictEqual(['object-name']);
          });
        });

        describe('when Bucket#getFiles response not exact matched files', () => {
          beforeEach(() => {
            const bucketMock = {
              getFiles: vi.fn().mockResolvedValue([[{ name: 'unmatched-object-name' }]]),
            };
            gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
          });

          it('return empty files', async() => {
            await expect(gcsServiceClient.listFiles(url, options)).resolves.toStrictEqual([]);
          });
        });

        describe('when Bucket#getFiles response prefix matched files', () => {
          beforeEach(() => {
            const bucketMock = {
              getFiles: vi.fn().mockResolvedValue([[{ name: 'object-name1' }]]),
            };
            gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
          });

          it('return prefix matched files', async() => {
            await expect(gcsServiceClient.listFiles(url, options)).resolves.toStrictEqual(['object-name1']);
          });
        });

        describe('when Bucket#getFiles response [null]', () => {
          beforeEach(() => {
            const bucketMock = {
              getFiles: vi.fn().mockResolvedValue([null]),
            };
            gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
          });

          it('reject with throw exception', async() => {
            await expect(gcsServiceClient.listFiles(url, options)).rejects.toThrow();
          });
        });

        describe('when Bucket#getFiles reject', () => {
          beforeEach(() => {
            const bucketMock = {
              getFiles: vi.fn().mockRejectedValue(new Error('some error')),
            };
            gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
          });

          it('reject with throw exception', async() => {
            await expect(gcsServiceClient.listFiles(url, options)).rejects.toThrow();
          });
        });
      });
    });

    describe("when request URI is not GCS's", () => {
      const url = 'http://hostname/';

      it('reject with throw exception', async() => {
        await expect(gcsServiceClient.listFiles(url)).rejects.toThrow();
      });
    });
  });

  describe('#deleteFile', () => {
    describe("when request URI is valid GCS's", () => {
      const url = 'gs://bucket-name/object-name';

      describe('when File#delete success', () => {
        beforeEach(() => {
          const fileMock = {
            delete: vi.fn().mockResolvedValue(undefined),
          };
          const bucketMock = {
            file: vi.fn().mockReturnValue(fileMock),
          };
          gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
        });

        it('resolve with undfined', async() => {
          await expect(gcsServiceClient.deleteFile(url)).resolves.toBe(undefined);
        });
      });

      describe('when File#delete fail', () => {
        beforeEach(() => {
          const fileMock = {
            delete: vi.fn().mockRejectedValue(new Error('some error')),
          };
          const bucketMock = {
            file: vi.fn().mockReturnValue(fileMock),
          };

          gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
        });

        it('reject and throw Error', async() => {
          await expect(gcsServiceClient.deleteFile(url)).rejects.toThrow();
        });
      });
    });

    describe("when request URI is not GCS's", () => {
      const url = 'http://hostname/';

      it('reject and throw Error', async() => {
        await expect(gcsServiceClient.deleteFile(url)).rejects.toThrow();
      });
    });
  });

  describe('#copyFile', () => {
    describe("when copySource is local file path and copyDestination is GCS's URI", () => {
      const copySource = '/path/to/file';
      const copyDestination = 'gs://bucket-name/object-name';
      const uploadFileMock = vi.fn().mockResolvedValue(undefined);

      beforeEach(async() => {
        gcsServiceClient.uploadFile = uploadFileMock;
        await gcsServiceClient.copyFile(copySource, copyDestination);
      });

      it('call uploadFile()', () => {
        expect(uploadFileMock).toBeCalled();
      });
    });

    describe("when copySource is GCS's URI and copyDestination is local file path", () => {
      const copySource = 'gs://bucket-name/object-name';
      const copyDestination = '/path/to/file';
      const downloadFileMock = vi.fn().mockResolvedValue(undefined);

      beforeEach(async() => {
        gcsServiceClient.downloadFile = downloadFileMock;
        await gcsServiceClient.copyFile(copySource, copyDestination);
      });

      it('call downloadFile()', () => {
        expect(downloadFileMock).toBeCalled();
      });
    });

    describe("when copySource and copyDestination are both GCS's URI", () => {
      const copySource = 'gs://bucket-name/object-name1';
      const copyDestination = 'gs://bucket-name/object-name2';
      const copyFileOnRemoteMock = vi.fn().mockResolvedValue(undefined);

      beforeEach(async() => {
        gcsServiceClient.copyFileOnRemote = copyFileOnRemoteMock;
        await gcsServiceClient.copyFile(copySource, copyDestination);
      });

      it('call copyFileOnRemote()', () => {
        expect(copyFileOnRemoteMock).toBeCalled();
      });
    });

    describe('when copySource and copyDestination are invalid', () => {
      it('reject and throw Error', async() => {
        // const gcsServiceClient = new GCSStorageServiceClient({
        //   gcpProjectId: 'validProjectId',
        //   gcpClientEmail: 'validClientEmail',
        //   gcpPrivateKey: 'validPrivateKey',
        // });
        await expect(gcsServiceClient.copyFile('s3://bucket-name/object-name1', 's3://bucket-name/object-name2')).rejects.toThrow();
      });
    });
  });

  describe('#uploadFile', () => {
    const uploadSource = '/path/to/file';
    const uploadDestination: GCSURI = { bucket: 'bucket-name', filepath: 'object-name' };

    describe('when File#upload resolve', () => {
      beforeEach(() => {
        const bucketMock = {
          upload: vi.fn().mockResolvedValue(undefined),
        };
        gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
      });

      it('resolve with undfined', async() => {
        await expect(gcsServiceClient.uploadFile(uploadSource, uploadDestination)).resolves.toBe(undefined);
      });
    });

    describe('when File#upload reject', () => {
      beforeEach(() => {
        const bucketMock = {
          upload: vi.fn().mockRejectedValue(new Error('some error')),
        };
        gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
      });

      it('reject and throw Error', async() => {
        await expect(gcsServiceClient.uploadFile(uploadSource, uploadDestination)).rejects.toThrow();
      });
    });
  });

  describe('#downloadFile', () => {
    const downloadSource: GCSURI = { bucket: 'bucket-name', filepath: 'object-name' };
    const downloadDestination = '/path/to/file';

    describe('when File#download resolve', () => {
      beforeEach(() => {
        const fileMock = {
          download: vi.fn().mockResolvedValue(undefined),
        };
        const bucketMock = {
          file: vi.fn().mockReturnValue(fileMock),
        };
        gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
      });

      it('resolve with undefined', async() => {
        await expect(gcsServiceClient.downloadFile(downloadSource, downloadDestination)).resolves.toBe(undefined);
      });
    });

    describe('when GCSStorageServiceClient#send reject', () => {
      beforeEach(() => {
        const fileMock = {
          download: vi.fn().mockRejectedValue(new Error('some error')),
        };
        const bucketMock = {
          file: vi.fn().mockReturnValue(fileMock),
        };
        gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
      });

      it('reject and throw Error', async() => {
        await expect(gcsServiceClient.downloadFile(downloadSource, downloadDestination)).rejects.toThrow();
      });
    });
  });

  describe('#copyFileOnRemote', () => {
    const copySource: GCSURI = { bucket: 'bucket-name', filepath: 'object-name1' };
    const copyDestination: GCSURI = { bucket: 'bucket-name', filepath: 'object-name2' };

    describe('when File#copy resolve', () => {
      beforeEach(() => {
        const fileMock = {
          copy: vi.fn().mockResolvedValue(undefined),
        };
        const bucketMock = {
          file: vi.fn().mockReturnValue(fileMock),
        };
        gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
      });

      it('resolve with undefined', async() => {
        await expect(gcsServiceClient.copyFileOnRemote(copySource, copyDestination)).resolves.toBe(undefined);
      });
    });

    describe('when File#copy reject', () => {
      beforeEach(() => {
        const fileMock = {
          copy: vi.fn().mockRejectedValue(new Error('some error')),
        };
        const bucketMock = {
          file: vi.fn().mockReturnValue(fileMock),
        };
        gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
      });

      it('reject and throw Error', async() => {
        await expect(gcsServiceClient.copyFileOnRemote(copySource, copyDestination)).rejects.toThrow();
      });
    });
  });

  describe('#uploadStream', () => {
    const uploadDestinationUri = 'gs://bucket-name/object-name';

    describe('when requested GCS URI is invalid', () => {
      const invalidUri = 'invalid://bucket-name/object-name';

      it('reject with throw error about invalid URI', async() => {
        const stream = new Readable();
        stream.push('test data');
        stream.push(null); // End of stream

        await expect(gcsServiceClient.uploadStream(stream, 'backupFileName', invalidUri))
          .rejects.toThrow(`URI ${invalidUri} is not correct GCS's`);
      });
    });

    describe('when requested GCS URI is valid', () => {
      describe('when write stream resolves', () => {
        beforeEach(() => {
          const writeStreamMock = vi.fn().mockResolvedValue(undefined);
          const fileMock = {
            createWriteStream: vi.fn().mockReturnValue(writeStreamMock),
          };
          const bucketMock = {
            file: vi.fn().mockReturnValue(fileMock),
          };
          gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
        });

        it('resolve with undefined', async() => {
          const stream = new Readable();
          stream.push('test data');
          stream.push(null); // End of stream

          await expect(gcsServiceClient.uploadStream(stream, 'backupFileName', uploadDestinationUri)).resolves.toBe(undefined);
        });
      });

      describe('when write stream rejects', () => {
        beforeEach(() => {
          const writeStreamMock = vi.fn().mockRejectedValue(new Error('stream error'));
          const fileMock = {
            createWriteStream: vi.fn().mockReturnValue(writeStreamMock),
          };
          const bucketMock = {
            file: vi.fn().mockReturnValue(fileMock),
          };
          gcsServiceClient.client.bucket = vi.fn().mockReturnValue(bucketMock);
        });

        it('reject and throw Error', async() => {
          const stream = new Readable();
          stream.push('test data');
          stream.push(null); // End of stream

          await expect(gcsServiceClient.uploadStream(stream, 'backupFileName', uploadDestinationUri)).rejects.toThrow('stream error');
        });
      });
    });
  });

  describe('_parseFilePath', () => {
    describe('when path start with "gs:"', () => {
      const path = 'gs://bucket/file';

      describe('and when match() succeed', () => {
        it('return GCSURI', () => {
          expect(Object.getPrototypeOf(gcsServiceClient)._parseFilePath(path)).toStrictEqual({ bucket: 'bucket', filepath: 'file' });
        });
      });

      describe('and when match() return null', () => {
        beforeEach(() => {
          vi.spyOn(String.prototype, 'match').mockReturnValue(null);
        });

        it('return null', () => {
          expect(Object.getPrototypeOf(gcsServiceClient)._parseFilePath(path)).toBe(null);
        });
      });
    });

    describe('when path does not start with "gs:"', () => {
      const path = '/path/to/file';

      it('return null', () => {
        expect(Object.getPrototypeOf(gcsServiceClient)._parseFilePath(path)).toBe(null);
      });
    });
  });
});

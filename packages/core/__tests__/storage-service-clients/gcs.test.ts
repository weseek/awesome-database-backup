import { GCSServiceClient, GCSURI } from '../../src/storage-service-clients/gcs';

describe('GCSServiceClient', () => {
  let gcsServiceClient: GCSServiceClient;

  beforeEach(() => {
    gcsServiceClient = new GCSServiceClient({});
  });

  describe('#exists', () => {
    describe('when listFiles() return object key list which include target object', () => {
      beforeEach(() => {
        gcsServiceClient.listFiles = jest.fn().mockResolvedValueOnce(['object-name']);
      });

      it('return true', async() => {
        const url = 'gs://bucket-name/object-name';
        await expect(gcsServiceClient.exists(url)).resolves.toBe(true);
      });
    });
  });

  describe('#listFiles', () => {
    let gcsServiceClient: GCSServiceClient;

    beforeEach(() => {
      gcsServiceClient = new GCSServiceClient({});
    });

    describe("when request URI is valid GCS's", () => {
      const url = 'gs://bucket-name/object-name';

      describe('when Bucket#getFiles response files', () => {
        beforeEach(() => {
          const bucketMock = {
            getFiles: jest.fn().mockResolvedValue([[{ name: 'file1' }]]),
          };
          gcsServiceClient.client.bucket = jest.fn().mockReturnValue(bucketMock);
        });

        it('return files', async() => {
          await expect(gcsServiceClient.listFiles(url)).resolves.toStrictEqual(['file1']);
        });
      });

      describe('when Bucket#getFiles response null', () => {
        beforeEach(() => {
          const bucketMock = {
            getFiles: jest.fn().mockReturnValue(Promise.resolve(null)),
          };
          gcsServiceClient.client.bucket = jest.fn().mockReturnValue(bucketMock);
        });

        it('reject with throw exception', async() => {
          await expect(gcsServiceClient.listFiles(url)).rejects.toThrowError();
        });
      });

      describe('when Bucket#getFiles reject', () => {
        beforeEach(() => {
          const bucketMock = {
            getFiles: jest.fn().mockReturnValue(Promise.resolve(null)),
          };
          gcsServiceClient.client.bucket = jest.fn().mockReturnValue(bucketMock);
        });

        it('reject with throw exception', async() => {
          await expect(gcsServiceClient.listFiles(url)).rejects.toThrowError();
        });
      });
    });

    describe("when request URI is not GCS's", () => {
      const url = 'http://hostname/';

      it('reject with throw exception', async() => {
        await expect(gcsServiceClient.listFiles(url)).rejects.toThrowError();
      });
    });
  });

  describe('#deleteFile', () => {
    let gcsServiceClient: GCSServiceClient;

    beforeEach(() => {
      gcsServiceClient = new GCSServiceClient({});
    });

    describe("when request URI is valid GCS's", () => {
      const url = 'gs://bucket-name/object-name';

      describe('when File#delete success', () => {
        beforeEach(() => {
          const fileMock = {
            delete: jest.fn().mockResolvedValue(undefined),
          };
          const bucketMock = {
            file: jest.fn().mockReturnValue(fileMock),
          };
          gcsServiceClient.client.bucket = jest.fn().mockReturnValue(bucketMock);
        });

        it('resolve with undfined', async() => {
          await expect(gcsServiceClient.deleteFile(url)).resolves.toBe(undefined);
        });
      });

      describe('when File#delete fail', () => {
        beforeEach(() => {
          const fileMock = {
            delete: jest.fn().mockReturnValue(Promise.reject(new Error('some error'))),
          };
          const bucketMock = {
            file: jest.fn().mockReturnValue(fileMock),
          };

          gcsServiceClient.client.bucket = jest.fn().mockReturnValue(bucketMock);
        });

        it('reject and throw Error', async() => {
          await expect(gcsServiceClient.deleteFile(url)).rejects.toThrowError();
        });
      });
    });

    describe("when request URI is not GCS's", () => {
      const url = 'http://hostname/';

      it('reject and throw Error', async() => {
        await expect(gcsServiceClient.deleteFile(url)).rejects.toThrowError();
      });
    });
  });

  describe('#copyFile', () => {
    let gcsServiceClient: GCSServiceClient;

    beforeEach(() => {
      gcsServiceClient = new GCSServiceClient({});
    });

    describe("when copySource is local file path and copyDestination is GCS's URI", () => {
      const copySource = '/path/to/file';
      const copyDestination = 'gs://bucket-name/object-name';
      const uploadFileMock = jest.fn().mockResolvedValue(undefined);

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
      const downloadFileMock = jest.fn().mockResolvedValue(undefined);

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
      const copyFileOnRemoteMock = jest.fn().mockResolvedValue(undefined);

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
        const gcsServiceClient = new GCSServiceClient({});
        await expect(gcsServiceClient.copyFile('s3://bucket-name/object-name1', 's3://bucket-name/object-name2')).rejects.toThrowError();
      });
    });
  });

  describe('#uploadFile', () => {
    const uploadSource = '/path/to/file';
    const uploadDestination: GCSURI = { bucket: 'bucket-name', filepath: 'object-name' };

    let gcsServiceClient: GCSServiceClient;

    beforeEach(() => {
      gcsServiceClient = new GCSServiceClient({});
    });

    describe('when File#upload resolve', () => {
      beforeEach(() => {
        const bucketMock = {
          upload: jest.fn().mockResolvedValue(undefined),
        };
        gcsServiceClient.client.bucket = jest.fn().mockReturnValue(bucketMock);
      });

      it('resolve with undfined', async() => {
        await expect(gcsServiceClient.uploadFile(uploadSource, uploadDestination)).resolves.toBe(undefined);
      });
    });

    describe('when File#upload reject', () => {
      beforeEach(() => {
        const bucketMock = {
          upload: jest.fn().mockRejectedValue(new Error('some error')),
        };
        gcsServiceClient.client.bucket = jest.fn().mockReturnValue(bucketMock);
      });

      it('reject and throw Error', async() => {
        await expect(gcsServiceClient.uploadFile(uploadSource, uploadDestination)).rejects.toThrowError();
      });
    });
  });

  describe('#downloadFile', () => {
    const downloadSource: GCSURI = { bucket: 'bucket-name', filepath: 'object-name' };
    const downloadDestination = '/path/to/file';

    let gcsServiceClient: GCSServiceClient;

    beforeEach(() => {
      gcsServiceClient = new GCSServiceClient({});
    });

    describe('when File#download resolve', () => {
      beforeEach(() => {
        const fileMock = {
          download: jest.fn().mockResolvedValue(undefined),
        };
        const bucketMock = {
          file: jest.fn().mockReturnValue(fileMock),
        };
        gcsServiceClient.client.bucket = jest.fn().mockReturnValue(bucketMock);
      });

      it('resolve with undefined', async() => {
        await expect(gcsServiceClient.downloadFile(downloadSource, downloadDestination)).resolves.toBe(undefined);
      });
    });

    describe('when GCSServiceClient#send reject', () => {
      beforeEach(() => {
        const fileMock = {
          download: jest.fn().mockReturnValue(Promise.reject(new Error('some error'))),
        };
        const bucketMock = {
          file: jest.fn().mockReturnValue(fileMock),
        };
        gcsServiceClient.client.bucket = jest.fn().mockReturnValue(bucketMock);
      });

      it('reject and throw Error', async() => {
        await expect(gcsServiceClient.downloadFile(downloadSource, downloadDestination)).rejects.toThrowError();
      });
    });
  });

  describe('#copyFileOnRemote', () => {
    const copySource: GCSURI = { bucket: 'bucket-name', filepath: 'object-name1' };
    const copyDestination: GCSURI = { bucket: 'bucket-name', filepath: 'object-name2' };

    let gcsServiceClient: GCSServiceClient;

    beforeEach(() => {
      gcsServiceClient = new GCSServiceClient({});
    });

    describe('when File#copy resolve', () => {
      beforeEach(() => {
        const fileMock = {
          copy: jest.fn().mockResolvedValue(undefined),
        };
        const bucketMock = {
          file: jest.fn().mockReturnValue(fileMock),
        };
        gcsServiceClient.client.bucket = jest.fn().mockReturnValue(bucketMock);
      });

      it('resolve with undefined', async() => {
        await expect(gcsServiceClient.copyFileOnRemote(copySource, copyDestination)).resolves.toBe(undefined);
      });
    });

    describe('when File#copy reject', () => {
      beforeEach(() => {
        const fileMock = {
          copy: jest.fn().mockReturnValue(Promise.reject(new Error('some error'))),
        };
        const bucketMock = {
          file: jest.fn().mockReturnValue(fileMock),
        };
        gcsServiceClient.client.bucket = jest.fn().mockReturnValue(bucketMock);
      });

      it('reject and throw Error', async() => {
        await expect(gcsServiceClient.copyFileOnRemote(copySource, copyDestination)).rejects.toThrowError();
      });
    });
  });
});

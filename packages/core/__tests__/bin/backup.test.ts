import { IBackupCLIOption } from '../../src/bin/backup';

let backup = require('../../src/bin/backup');

describe('BackupCommand', () => {
  describe('backupOnce', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.doMock('../../src/utils/tar', () => {
        const actual = jest.requireActual('../../src/utils/tar');
        return {
          ...actual,
          compress: jest.fn().mockReturnValue(''),
        };
      });
      backup = require('../../src/bin/backup');
    });
    afterEach(() => {
      jest.dontMock('../../src/utils/tar');
    });

    describe('when healthchecksUrl is empty', () => {
      it('return undefined and call dumpDatabaseFunc()', async() => {
        const bakupCommand = new backup.BackupCommand();
        const storageServiceClientMock = {
          copyFile: jest.fn()
        };
        const dumpDatabaseFuncMock = jest.fn().mockReturnValue({ stdout: "", stderr: "" });
        const targetBucketUrl = new URL('gs://sample.com/bucket');
        const options: IBackupCLIOption = {
          backupfilePrefix: 'backup',
        };
        await expect(bakupCommand.backupOnce(storageServiceClientMock, dumpDatabaseFuncMock, targetBucketUrl, options)).resolves.toBe(undefined);
        expect(dumpDatabaseFuncMock).toBeCalled();
      });
    });

    describe('when healthcheckUrl is not empty', () => {
      const axiosGetMock = jest.fn().mockReturnValue(Promise.resolve());

      beforeEach(() => {
        jest.resetModules();
        jest.doMock('axios', () => {
          const actual = jest.requireActual('axios');
          return {
            ...actual,
            get: axiosGetMock,
          };
        });
        backup = require('../../src/bin/backup');
      });
      afterEach(() => {
        jest.dontMock('axios');
      });

      it('return undefined and call axios with "healthcheckUrl"', async() => {
        const bakupCommand = new backup.BackupCommand();
        const storageServiceClientMock = {
          copyFile: jest.fn()
        };
        const dumpDatabaseFuncMock = jest.fn().mockReturnValue({ stdout: "", stderr: "" });
        const targetBucketUrl = new URL('gs://sample.com/bucket');
        const options: IBackupCLIOption = {
          backupfilePrefix: 'backup',
          healthchecksUrl: 'http://example.com/',
        };
        await expect(bakupCommand.backupOnce(storageServiceClientMock, dumpDatabaseFuncMock, targetBucketUrl, options)).resolves.toBe(undefined);
        expect(axiosGetMock).toBeCalledWith(options.healthchecksUrl?.toString());
      });
    });
  });
});

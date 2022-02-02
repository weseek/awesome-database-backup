import { IBackupCLIOption } from '../../src/bin/backup';

let backup = require('../../src/bin/backup');

describe('BackupCommand', () => {
  describe('backupOnce', () => {
    describe('when healthchecksUrl is empty', () => {
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

      it('return undefined', async() => {
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
      });
    });
  });
});

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
        const backupCommand = new backup.BackupCommand();
        const storageServiceClientMock = {
          copyFile: jest.fn()
        };
        const dumpDatabaseFuncMock = jest.fn().mockReturnValue({ stdout: "", stderr: "" });
        const targetBucketUrl = new URL('gs://sample.com/bucket');
        const options: IBackupCLIOption = {
          backupfilePrefix: 'backup',
        };
        await expect(backupCommand.backupOnce(storageServiceClientMock, dumpDatabaseFuncMock, targetBucketUrl, options)).resolves.toBe(undefined);
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
        const backupCommand = new backup.BackupCommand();
        const storageServiceClientMock = {
          copyFile: jest.fn()
        };
        const dumpDatabaseFuncMock = jest.fn().mockReturnValue({ stdout: "", stderr: "" });
        const targetBucketUrl = new URL('gs://sample.com/bucket');
        const options: IBackupCLIOption = {
          backupfilePrefix: 'backup',
          healthchecksUrl: 'http://example.com/',
        };
        await expect(backupCommand.backupOnce(storageServiceClientMock, dumpDatabaseFuncMock, targetBucketUrl, options)).resolves.toBe(undefined);
        expect(axiosGetMock).toBeCalledWith(options.healthchecksUrl?.toString());
      });
    });
  });

  describe('backupCronMode', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });


    it('call backupOnce() at specified time', () => {
      const backupCommand = new backup.BackupCommand();
      const storageServiceClientMock = {
        copyFile: jest.fn()
      };
      const dumpDatabaseFuncMock = jest.fn().mockReturnValue({ stdout: "", stderr: "" });
      const targetBucketUrl = new URL('gs://sample.com/bucket');
      const options: IBackupCLIOption = {
        backupfilePrefix: 'backup',
        cronExpression: '* * * * *',
      };
      const backupOnceMock = jest.fn();
      backupCommand.backupOnce = backupOnceMock;
      backupCommand.backupCronMode(storageServiceClientMock, dumpDatabaseFuncMock, targetBucketUrl, options);
      expect(backupOnceMock).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(1000 * 60);
      expect(backupOnceMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('setBackupArgument', () => {

    it('call argument()', () => {
      const backupCommand = new backup.BackupCommand();
      const argumentMock = jest.fn().mockReturnValue(backupCommand);
      backupCommand.argument = argumentMock;
      backupCommand.setBackupArgument();
      expect(argumentMock).toBeCalled();
    });
  });

  describe('addBackupOptions', () => {

    it('call option()', () => {
      const backupCommand = new backup.BackupCommand();
      const optionMock = jest.fn().mockReturnValue(backupCommand);
      backupCommand.option = optionMock;
      backupCommand.addBackupOptions();
      expect(optionMock).toBeCalled();
    });
  });
});

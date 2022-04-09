import { BackupCommand, IBackupCommandOption } from '../../src/commands/backup';
import { IStorageServiceClient } from '../../src/storage-service-clients/interfaces';

let backup = require('../../src/commands/backup');

describe('BackupCommand', () => {
  const targetBucketUrl = new URL('gs://sample.com/bucket');
  const dumpDatabaseFuncMock = jest.fn().mockReturnValue({ stdout: '', stderr: '' });
  const storageServiceClientMock: IStorageServiceClient = {
    copyFile: jest.fn(),
    name: '',
    exists: jest.fn(),
    listFiles: jest.fn(),
    deleteFile: jest.fn(),
  };

  describe('backupOnce', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.doMock('../../src/utils/tar', () => {
        const mock = jest.requireActual('../../src/utils/tar');
        mock.compressBZIP2 = jest.fn().mockReturnValue('');
        return mock;
      });
      backup = require('../../src/commands/backup');
    });
    afterEach(() => {
      jest.dontMock('../../src/utils/tar');
    });

    describe('when healthchecksUrl is empty', () => {
      const options: IBackupCommandOption = {
        backupfilePrefix: 'backup',
      };

      it('return undefined and call dumpDatabaseFunc()', async() => {
        const backupCommand = new backup.BackupCommand();
        await expect(backupCommand.backupOnce(storageServiceClientMock, dumpDatabaseFuncMock, targetBucketUrl, options)).resolves.toBe(undefined);
        expect(dumpDatabaseFuncMock).toBeCalled();
      });
    });

    describe('when healthcheckUrl is not empty', () => {
      const options: IBackupCommandOption = {
        backupfilePrefix: 'backup',
        healthchecksUrl: 'http://example.com/',
      };

      const axiosGetMock = jest.fn().mockReturnValue(Promise.resolve());

      beforeEach(() => {
        jest.resetModules();
        jest.doMock('axios', () => {
          const mock = jest.requireActual('axios');
          mock.get = axiosGetMock;
          return mock;
        });
        backup = require('../../src/commands/backup');
      });
      afterEach(() => {
        jest.dontMock('axios');
      });

      it('return undefined and call axios with "healthcheckUrl"', async() => {
        const backupCommand = new backup.BackupCommand();
        await expect(backupCommand.backupOnce(storageServiceClientMock, dumpDatabaseFuncMock, targetBucketUrl, options)).resolves.toBe(undefined);
        expect(axiosGetMock).toBeCalledWith(options.healthchecksUrl?.toString());
      });
    });
  });

  describe('backupCronMode', () => {
    const options: IBackupCommandOption = {
      backupfilePrefix: 'backup',
      cronExpression: '* * * * *',
    };
    const backupOnceMock = jest.fn();

    let backupCommand: BackupCommand;

    beforeEach(() => {
      jest.useFakeTimers();
      backupCommand = new backup.BackupCommand();
      backupCommand.backupOnce = backupOnceMock;
    });
    afterEach(() => jest.useRealTimers());

    it('call backupOnce() at specified time', () => {
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

  describe('setBackupAction', () => {
    it('call action()', () => {
      const backupCommand = new backup.BackupCommand();
      const actionMock = jest.fn().mockReturnValue(backupCommand);
      backupCommand.action = actionMock;
      backupCommand.setBackupAction();
      expect(actionMock).toBeCalled();
    });
  });
});

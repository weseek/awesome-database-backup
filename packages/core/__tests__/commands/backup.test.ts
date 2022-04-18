import { BackupCommand, IBackupCommandOption } from '../../src/commands/backup';
import { IStorageServiceClient } from '../../src/storage-service-clients/interfaces';

let backup = require('../../src/commands/backup');

describe('BackupCommand', () => {
  const dumpDBFuncMock = jest.fn().mockReturnValue({ stdout: '', stderr: '' });
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
        targetBucketUrl: new URL('s3://valid-bucket'),
        backupfilePrefix: 'backup',
      };

      it('return undefined and call dumpDBFunc()', async() => {
        const backupCommand = new backup.BackupCommand();
        backupCommand.dumpDB = dumpDBFuncMock;
        backupCommand.storageServiceClient = storageServiceClientMock;
        await expect(backupCommand.backupOnce(options)).resolves.toBe(undefined);
        expect(dumpDBFuncMock).toBeCalled();
      });
    });

    describe('when healthcheckUrl is not empty', () => {
      const options: IBackupCommandOption = {
        targetBucketUrl: new URL('s3://valid-bucket'),
        backupfilePrefix: 'backup',
        healthchecksUrl: new URL('http://example.com/'),
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
        backupCommand.dumpDB = dumpDBFuncMock;
        backupCommand.storageServiceClient = storageServiceClientMock;
        await expect(backupCommand.backupOnce(options)).resolves.toBe(undefined);
        expect(axiosGetMock).toBeCalledWith(options.healthchecksUrl?.toString());
      });
    });
  });

  describe('backupCronMode', () => {
    const options: IBackupCommandOption = {
      targetBucketUrl: new URL('s3://valid-bucket'),
      backupfilePrefix: 'backup',
      cronmode: '* * * * *',
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
      backupCommand.dumpDB = dumpDBFuncMock;
      backupCommand.storageServiceClient = storageServiceClientMock;
      backupCommand.backupCronMode(options);

      expect(backupOnceMock).toHaveBeenCalledTimes(0);
      jest.advanceTimersByTime(1000 * 60);
      expect(backupOnceMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('addBackupOptions', () => {
    it('call addOption()', () => {
      const backupCommand = new backup.BackupCommand();
      const addOptionMock = jest.fn().mockReturnValue(backupCommand);
      backupCommand.addOption = addOptionMock;
      backupCommand.addBackupOptions();
      expect(addOptionMock).toBeCalled();
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

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

  describe('dumpDB', () => {
    const command = new backup.BackupCommand();
    const destinationPath = 'test-path';

    it('reject with error', async() => {
      await expect(command.dumpDB(destinationPath))
        .rejects
        .toThrowError('Method not implemented.');
    });
  });

  describe('backup', () => {
    describe('when cromode is empty', () => {
      const command = new backup.BackupCommand();
      const options: IBackupCommandOption = {
        targetBucketUrl: new URL('s3://valid-bucket'),
        backupfilePrefix: 'backup',
      };

      beforeEach(() => {
        command.backupOnce = jest.fn().mockResolvedValue(undefined);
      });

      it('call backupOnce()', async() => {
        await expect(command.execBackupAction(options)).resolves.toBe(undefined);
        expect(command.backupOnce).toBeCalled();
      });
    });

    describe('when cromode is present', () => {
      const command = new backup.BackupCommand();
      const options: IBackupCommandOption = {
        targetBucketUrl: new URL('s3://valid-bucket'),
        backupfilePrefix: 'backup',
        cronmode: '* * * * *',
      };

      beforeEach(() => {
        command.backupCronMode = jest.fn().mockResolvedValue(undefined);
      });

      it('call backupOnce()', async() => {
        await expect(command.execBackupAction(options)).resolves.toBe(undefined);
        expect(command.backupCronMode).toBeCalled();
      });
    });

    describe('when some error occured', () => {
      let command: BackupCommand;
      const options: IBackupCommandOption = {
        targetBucketUrl: new URL('s3://valid-bucket'),
        backupfilePrefix: 'backup',
      };
      const loggerMock = jest.fn();

      beforeEach(() => {
        jest.resetModules();
        jest.doMock('../../src/logger/factory', () => {
          return {
            __esModule: true,
            default: () => ({
              info: jest.fn(),
              warn: jest.fn(),
              error: loggerMock,
            }),
          };
        });
        backup = require('../../src/commands/backup');

        command = new backup.BackupCommand();
        command.backupOnce = jest.fn().mockRejectedValue(new Error('some error'));
      });
      afterEach(() => {
        jest.dontMock('../../src/logger/factory');
      });

      it('reject with error and logging error', async() => {
        await expect(command.execBackupAction(options)).rejects.toThrowError('some error');
        expect(loggerMock).toBeCalledWith('Error: some error');
      });
    });
  });

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

    describe('when options are valid, but "storageServiceClient" is not set in advance', () => {
      const command = new backup.BackupCommand();
      const options: IBackupCommandOption = {
        targetBucketUrl: new URL('s3://valid-bucket'),
        backupfilePrefix: 'backup',
      };

      it('reject with error', async() => {
        await expect(command.backupOnce(options))
          .rejects
          .toThrowError('URL scheme is not that of a supported provider.');
      });
    });

    describe('when options are valid and "healthchecksUrl" is empty', () => {
      let command: BackupCommand;
      const axiosGetMock = jest.fn().mockReturnValue(Promise.resolve());
      const options: IBackupCommandOption = {
        targetBucketUrl: new URL('s3://valid-bucket'),
        backupfilePrefix: 'backup',
      };

      beforeEach(() => {
        jest.resetModules();
        jest.doMock('axios', () => {
          const mock = jest.requireActual('axios');
          mock.get = axiosGetMock;
          return mock;
        });
        backup = require('../../src/commands/backup');

        command = new backup.BackupCommand();
        command.dumpDB = dumpDBFuncMock;
        command.storageServiceClient = storageServiceClientMock;
      });
      afterEach(() => {
        jest.dontMock('axios');
      });

      it('return undefined and call dumpDB(), but does not call axios.get()', async() => {
        await expect(command.backupOnce(options)).resolves.toBe(undefined);
        expect(dumpDBFuncMock).toBeCalled();
        expect(axiosGetMock).toBeCalledTimes(0);
      });
    });

    describe('when "healthcheckUrl" is present', () => {
      let command: BackupCommand;
      const axiosGetMock = jest.fn().mockResolvedValue(undefined);
      const options: IBackupCommandOption = {
        targetBucketUrl: new URL('s3://valid-bucket'),
        backupfilePrefix: 'backup',
        healthchecksUrl: new URL('http://example.com/'),
      };

      beforeEach(() => {
        jest.resetModules();
        jest.doMock('axios', () => {
          const mock = jest.requireActual('axios');
          mock.get = axiosGetMock;
          return mock;
        });
        backup = require('../../src/commands/backup');

        command = new backup.BackupCommand();
        command.dumpDB = dumpDBFuncMock;
        command.storageServiceClient = storageServiceClientMock;
      });
      afterEach(() => {
        jest.dontMock('axios');
      });

      it('return undefined and call dumpDB() and call axios.get() with "healthcheckUrl"', async() => {
        await expect(command.backupOnce(options)).resolves.toBe(undefined);
        expect(dumpDBFuncMock).toBeCalled();
        expect(axiosGetMock).toBeCalledWith(options.healthchecksUrl?.toString());
      });
    });

    describe('when "healthcheckUrl" is present which cannot get with error', () => {
      let command: BackupCommand;
      const axiosGetMock = jest.fn().mockRejectedValue(new Error('cannot get'));
      const loggerMock = jest.fn();
      const options: IBackupCommandOption = {
        targetBucketUrl: new URL('s3://valid-bucket'),
        backupfilePrefix: 'backup',
        healthchecksUrl: new URL('http://example.com/'),
      };

      beforeEach(() => {
        jest.resetModules();
        jest.doMock('axios', () => {
          const mock = jest.requireActual('axios');
          mock.get = axiosGetMock;
          return mock;
        });
        jest.doMock('../../src/logger/factory', () => {
          return {
            __esModule: true,
            default: () => ({
              info: jest.fn(),
              warn: loggerMock,
            }),
          };
        });
        backup = require('../../src/commands/backup');

        command = new backup.BackupCommand();
        command.dumpDB = dumpDBFuncMock;
        command.storageServiceClient = storageServiceClientMock;
      });
      afterEach(() => {
        jest.dontMock('axios');
        jest.dontMock('../../src/logger/factory');
      });

      it('return undefined and call dumpDB() and call axios.get() with error and call logging', async() => {
        await expect(command.backupOnce(options)).resolves.toBe(undefined);
        expect(dumpDBFuncMock).toBeCalled();
        expect(axiosGetMock).toBeCalledWith(options.healthchecksUrl?.toString());
        expect(loggerMock).toBeCalledWith('Cannot access to URL for health check. Error: cannot get');
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
      backupCommand.saveStorageClientInAdvance = jest.fn().mockReturnValue(backupCommand);
      backupCommand.action = jest.fn().mockReturnValue(backupCommand);

      backupCommand.setBackupAction();
      expect(backupCommand.saveStorageClientInAdvance).toBeCalled();
      expect(backupCommand.action).toBeCalled();
    });
  });
});

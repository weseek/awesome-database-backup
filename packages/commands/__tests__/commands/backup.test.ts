import { IStorageServiceClient } from '@awesome-database-backup/storage-service-clients';
import { BackupCommand, IBackupCommandOption } from '../../src/commands/backup';

describe('BackupCommand', () => {
  let command: BackupCommand;

  // Default mock of logger
  const loggerMock = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  // Default mock of axios
  // You can overridden in "beforeAll" before test execution.
  let axiosGetMock = jest.fn().mockResolvedValue(undefined);
  // Default mock of dumpDB
  const dumpDBFuncMock = jest.fn().mockReturnValue({ stdout: '', stderr: '' });
  // Default mock of storageServiceClient
  const storageServiceClientMock: IStorageServiceClient = {
    name: '',
    exists: jest.fn(),
    listFiles: jest.fn().mockResolvedValue([]),
    copyFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(() => {
    jest.resetModules();

    // Mock Logger
    jest.doMock('universal-bunyan', () => {
      return {
        ...(jest.requireActual('universal-bunyan') as any),
        createLogger: () => loggerMock,
      };
    });

    // Mock axios
    jest.doMock('axios', () => {
      return {
        ...(jest.requireActual('axios') as any),
        get: axiosGetMock,
      };
    });

    const backup = require('../../src/commands/backup');
    command = new backup.BackupCommand();
  });
  afterEach(() => {
    jest.dontMock('universal-bunyan');
    jest.dontMock('axios');
  });

  const s3BareMinimumOptions: IBackupCommandOption = {
    targetBucketUrl: new URL('s3://valid-bucket'),
    backupfilePrefix: 'backup',
  };

  describe('dumpDB', () => {
    const option = s3BareMinimumOptions;

    it('reject with error', async() => {
      await expect(command.dumpDB(option))
        .rejects
        .toThrowError('Method not implemented.');
    });
  });

  describe('execBackupAction', () => {
    describe('when cromode is empty', () => {
      const options = s3BareMinimumOptions;

      beforeEach(() => {
        command.backupOnce = jest.fn().mockResolvedValue(undefined);
      });

      it('call backupOnce()', async() => {
        await expect(command.execBackupAction(options)).resolves.toBe(undefined);
        expect(command.backupOnce).toBeCalled();
      });
    });

    describe('when cromode is present', () => {
      const options: IBackupCommandOption = {
        ...s3BareMinimumOptions,
        cronmode: '* * * * *',
      };

      beforeEach(() => {
        command.backupCronMode = jest.fn().mockResolvedValue(undefined);
      });

      it('call backupCronMode()', async() => {
        await expect(command.execBackupAction(options)).resolves.toBe(undefined);
        expect(command.backupCronMode).toBeCalled();
      });
    });
  });

  describe('backupOnce', () => {
    beforeEach(() => {
      command.dumpDB = dumpDBFuncMock;
    });

    describe('when options are valid, but "storageServiceClient" is not set in advance', () => {
      const options = s3BareMinimumOptions;

      beforeEach(() => {
        command.storageServiceClient = null;
      });

      it('reject with error', async() => {
        await expect(command.backupOnce(options))
          .rejects
          .toThrowError('URL scheme is not that of a supported provider.');
      });
    });

    describe('when options are valid and "storageServiceClient" is set in advance', () => {
      beforeEach(() => {
        command.storageServiceClient = storageServiceClientMock;
      });

      describe('and when "healthchecksUrl" is empty', () => {
        const options = s3BareMinimumOptions;

        beforeAll(() => {
          axiosGetMock = jest.fn().mockResolvedValue(undefined);
        });

        it('return undefined and call dumpDB(), but does not call axios.get()', async() => {
          await expect(command.backupOnce(options)).resolves.toBe(undefined);
          expect(command.dumpDB).toBeCalled();
          expect(axiosGetMock).toBeCalledTimes(0);
        });
      });

      describe('and when "healthcheckUrl" is present which can get successfully', () => {
        const options: IBackupCommandOption = {
          ...s3BareMinimumOptions,
          healthchecksUrl: new URL('http://example.com/'),
        };

        beforeAll(() => {
          axiosGetMock = jest.fn().mockResolvedValue(undefined);
        });

        it('return undefined and call dumpDB() and call axios.get() with "healthcheckUrl"', async() => {
          await expect(command.backupOnce(options)).resolves.toBe(undefined);
          expect(command.dumpDB).toBeCalled();
          expect(axiosGetMock).toBeCalledWith(options.healthchecksUrl?.toString());
        });
      });

      describe('and when "healthcheckUrl" is present which cannot get with error', () => {
        const options: IBackupCommandOption = {
          ...s3BareMinimumOptions,
          healthchecksUrl: new URL('http://example.com/'),
        };

        beforeAll(() => {
          axiosGetMock = jest.fn().mockRejectedValue(new Error('cannot get'));
        });

        it('return undefined and call dumpDB() and call axios.get() with error and call logging', async() => {
          await expect(command.backupOnce(options)).resolves.toBe(undefined);
          expect(command.dumpDB).toBeCalled();
          expect(axiosGetMock).toBeCalledWith(options.healthchecksUrl?.toString());
          expect(loggerMock.warn).toBeCalledWith('Cannot access to URL for health check. Error: cannot get');
        });
      });
    });
  });

  describe('backupCronMode', () => {
    const options: IBackupCommandOption = {
      ...s3BareMinimumOptions,
      cronmode: '* * * * *', // backup every minute
    };

    beforeEach(() => {
      jest.useFakeTimers();
      command.backupOnce = jest.fn();
      command.storageServiceClient = storageServiceClientMock;
    });
    afterEach(() => jest.useRealTimers());

    it('call backupOnce() at specified time', () => {
      command.backupCronMode(options);

      expect(command.backupOnce).toHaveBeenCalledTimes(0);
      jest.advanceTimersByTime(1000 * 60);
      expect(command.backupOnce).toHaveBeenCalledTimes(1);
    });
  });

  describe('addBackupOptions', () => {
    beforeEach(() => {
      jest.spyOn(command, 'addOption');
    });

    it('call addOption()', () => {
      command.addBackupOptions();
      expect(command.addOption).toBeCalled();
    });
  });

  describe('setBackupAction', () => {
    beforeEach(() => {
      jest.spyOn(command, 'saveStorageClientInAdvance');
      jest.spyOn(command, 'action');
    });

    it('call saveStorageClientInAdvance() and action()', () => {
      command.setBackupAction();
      expect(command.saveStorageClientInAdvance).toBeCalled();
      expect(command.action).toBeCalled();
    });
  });
});

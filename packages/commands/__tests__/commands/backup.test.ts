import {
  vi, afterEach, describe, beforeAll, beforeEach, it, expect,
  type MockInstance,
} from 'vitest';
import { IStorageServiceClient } from '@awesome-database-backup/storage-service-clients';
import type { BackupCommand, IBackupCommandOption } from '../../src/commands/backup';

describe('BackupCommand', () => {
  let command: BackupCommand;
  let axiosSpy: MockInstance;
  // Default mock of logger
  const loggerMock = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  // Default mock of storageServiceClient
  const storageServiceClientMock: IStorageServiceClient = {
    name: '',
    exists: vi.fn(),
    listFiles: vi.fn().mockResolvedValue([]),
    copyFile: vi.fn(),
    deleteFile: vi.fn(),
    uploadStream: vi.fn(),
  };

  beforeEach(async() => {
    vi.resetModules();

    // Mock Logger
    vi.doMock('universal-bunyan', () => {
      return {
        ...(vi.importActual('universal-bunyan') as any),
        createLogger: () => loggerMock,
      };
    });

    const axios = require('axios');
    axiosSpy = vi.spyOn(axios, 'get');

    const backup = await import('../../src/commands/backup');
    command = new backup.BackupCommand();
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
        command.backupOnceWithStream = vi.fn().mockResolvedValue(undefined);
      });

      it('call backupOnceWithStream()', async() => {
        await expect(command.execBackupAction(options)).resolves.toBe(undefined);
        expect(command.backupOnceWithStream).toBeCalled();
      });
    });

    describe('when cronmode is present', () => {
      const options: IBackupCommandOption = {
        ...s3BareMinimumOptions,
        cronmode: '* * * * *',
      };

      beforeEach(() => {
        command.backupCronMode = vi.fn().mockResolvedValue(undefined);
      });

      it('call backupCronMode()', async() => {
        await expect(command.execBackupAction(options)).resolves.toBe(undefined);
        expect(command.backupCronMode).toBeCalled();
      });
    });
  });

  describe('backupOnce', () => {
    beforeEach(() => {
      command.dumpDB = vi.fn().mockReturnValue({ stdout: '', stderr: '' });
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

        beforeEach(() => {
          axiosSpy.mockResolvedValue(undefined);
        });

        it('return undefined and call dumpDB(), but does not call axios.get()', async() => {
          await expect(command.backupOnce(options)).resolves.toBe(undefined);
          expect(command.dumpDB).toBeCalled();
          expect(axiosSpy).toBeCalledTimes(0);
        });
      });

      describe('and when "healthchecksUrl" is present which can get successfully', () => {
        const options: IBackupCommandOption = {
          ...s3BareMinimumOptions,
          healthchecksUrl: new URL('http://example.com/'),
        };

        beforeEach(() => {
          axiosSpy.mockResolvedValue(undefined);
          command.processEndOfBackupOnce = vi.fn().mockResolvedValue(undefined);
        });

        it('return undefined and call dumpDB() and processEndOfBackupOnce() with options', async() => {
          await expect(command.backupOnce(options)).resolves.toBe(undefined);
          expect(command.dumpDB).toBeCalled();
          expect(command.processEndOfBackupOnce).toBeCalledWith(options);
        });
      });

      describe('and when "healthchecksUrl" is present which cannot get with error', () => {
        const options: IBackupCommandOption = {
          ...s3BareMinimumOptions,
          healthchecksUrl: new URL('http://example.com/'),
        };

        beforeEach(() => {
          command.processEndOfBackupOnce = vi.fn().mockResolvedValue(undefined);
        });

        it('return undefined and call dumpDB() and processEndOfBackupOnce() with options', async() => {
          await expect(command.backupOnce(options)).resolves.toBe(undefined);
          expect(command.dumpDB).toBeCalled();
          expect(command.processEndOfBackupOnce).toBeCalledWith(options);
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
      vi.useFakeTimers();
      command.backupOnce = vi.fn();
      command.storageServiceClient = storageServiceClientMock;
    });
    afterEach(() => vi.useRealTimers());

    it('call backupOnce() at specified time', () => {
      command.backupCronMode(options);

      expect(command.backupOnce).toHaveBeenCalledTimes(0);
      vi.advanceTimersByTime(1000 * 60);
      expect(command.backupOnce).toHaveBeenCalledTimes(1);
    });
  });

  describe('addBackupOptions', () => {
    beforeEach(() => {
      vi.spyOn(command, 'addOption');
    });

    it('call addOption()', () => {
      command.addBackupOptions();
      expect(command.addOption).toBeCalled();
    });
  });

  describe('setBackupAction', () => {
    beforeEach(() => {
      vi.spyOn(command, 'saveStorageClientInAdvance');
      vi.spyOn(command, 'action');
    });

    it('call saveStorageClientInAdvance() and action()', () => {
      command.setBackupAction();
      expect(command.saveStorageClientInAdvance).toBeCalled();
      expect(command.action).toBeCalled();
    });
  });

  describe('processEndOfBackupOnce', () => {
    describe('when healthchecksUrl is empty', () => {
      const options = s3BareMinimumOptions;

      it('return undefined and does not call axios.get()', async() => {
        await expect(command.processEndOfBackupOnce(options)).resolves.toBe(undefined);
        expect(axiosSpy).not.toBeCalled();
      });
    });

    describe('when healthchecksUrl is present which can get successfully', () => {
      const options: IBackupCommandOption = {
        ...s3BareMinimumOptions,
        healthchecksUrl: new URL('http://example.com/'),
      };

      beforeEach(() => {
        axiosSpy.mockResolvedValue(undefined);
      });

      it('return undefined and call axios.get() with healthchecksUrl', async() => {
        await expect(command.processEndOfBackupOnce(options)).resolves.toBe(undefined);
        expect(axiosSpy).toBeCalledWith(options.healthchecksUrl?.toString());
      });
    });

    describe('when healthchecksUrl is present which cannot get with error', () => {
      const options: IBackupCommandOption = {
        ...s3BareMinimumOptions,
        healthchecksUrl: new URL('http://example.com/'),
      };

      beforeEach(() => {
        axiosSpy.mockRejectedValue(new Error('cannot get'));
      });

      it('return undefined and call axios.get() with error and call logging', async() => {
        await expect(command.processEndOfBackupOnce(options)).resolves.toBe(undefined);
        expect(axiosSpy).toBeCalledWith(options.healthchecksUrl?.toString());
        expect(loggerMock.warn).toBeCalledWith('Cannot access to URL for health check. Error: cannot get');
      });
    });
  });

  describe('getBackupFileName', () => {
    it('should return the same file name for the same options (cache works)', async() => {
      const options = { backupfilePrefix: 'backup', targetBucketUrl: new URL('s3://bucket') };
      const name1 = command.getBackupFileName(options);
      const name2 = command.getBackupFileName(options);
      expect(name1).toBe(name2);
    });
  });
});

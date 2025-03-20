import {
  vi, describe, beforeEach, it, expect,
} from 'vitest';
import { IStorageServiceClient } from '@awesome-database-backup/storage-service-clients';
import { RestoreCommand, IRestoreCommandOption } from '../../src/commands/restore';

describe('RestoreCommand', () => {
  let command: RestoreCommand;

  // Default mock of logger
  const loggerMock = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  // Default mock of StorageServiceClient
  const gcsClientMock: IStorageServiceClient = {
    name: 'GCS',
    exists: vi.fn(),
    listFiles: vi.fn().mockResolvedValue([]),
    copyFile: vi.fn(),
    deleteFile: vi.fn(),
    uploadStream: vi.fn(),
  };
  // Default mock of restoreDB()
  const restoreDBFuncMock = vi.fn().mockReturnValue({ stdout: '', stderr: '' });
  // Default mock of processBackupFile()
  const processBackupFileMock = vi.fn().mockResolvedValue('path');

  beforeEach(async() => {
    vi.resetModules();

    // Mock Logger
    vi.doMock('universal-bunyan', () => {
      return {
        ...(vi.importActual('universal-bunyan') as any),
        createLogger: () => loggerMock,
      };
    });

    const restore = await import('../../src/commands/restore');
    command = new restore.RestoreCommand();
  });

  const gcsBareMinumumOptions: IRestoreCommandOption = {
    targetBucketUrl: new URL('gs://example.com/bucket/'),
  };

  describe('restoreDB', () => {
    const sourcePath = 'test-path';

    it('reject with error', async() => {
      await expect(command.restoreDB(sourcePath))
        .rejects
        .toThrowError('Method not implemented.');
    });
  });

  describe('restore', () => {
    beforeEach(() => {
      command.restoreDB = restoreDBFuncMock;
      command.processBackupFile = processBackupFileMock;
    });

    describe('when options are valid, but "storageServiceClient" is not set in advance', () => {
      const options = gcsBareMinumumOptions;

      beforeEach(() => {
        command.storageServiceClient = null;
      });

      it('reject with error', async() => {
        await expect(command.restore(options))
          .rejects
          .toThrowError('URL scheme is not that of a supported provider.');
      });
    });

    describe('when options are valid and "storageServiceClient" is set in advance', () => {
      const options = gcsBareMinumumOptions;

      beforeEach(() => {
        command.storageServiceClient = gcsClientMock;
      });

      it('return undefined', async() => {
        await expect(command.restore(options)).resolves.toBe(undefined);
      });
    });
  });

  describe('addRestoreOptions', () => {
    beforeEach(() => {
      vi.spyOn(command, 'addOption');
    });

    it('call addOption()', () => {
      command.addRestoreOptions();
      expect(command.addOption).toBeCalled();
    });
  });

  describe('setRestoreAction', () => {
    beforeEach(() => {
      vi.spyOn(command, 'saveStorageClientInAdvance');
      vi.spyOn(command, 'action');
    });

    it('call action()', () => {
      command.setRestoreAction();
      expect(command.saveStorageClientInAdvance).toBeCalled();
      expect(command.action).toBeCalled();
    });
  });
});

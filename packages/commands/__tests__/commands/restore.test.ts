import { IStorageServiceClient } from '@awesome-database-backup/storage-service-clients';
import { RestoreCommand, IRestoreCommandOption } from '../../src/commands/restore';

describe('RestoreCommand', () => {
  let command: RestoreCommand;

  // Default mock of logger
  const loggerMock = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  // Default mock of StorageServiceClient
  const gcsClientMock: IStorageServiceClient = {
    name: 'GCS',
    exists: jest.fn(),
    listFiles: jest.fn().mockResolvedValue([]),
    copyFile: jest.fn(),
    deleteFile: jest.fn(),
  };
  // Default mock of restoreDB()
  const restoreDBFuncMock = jest.fn().mockReturnValue({ stdout: '', stderr: '' });
  // Default mock of processBackupFile()
  const processBackupFileMock = jest.fn().mockResolvedValue('path');

  beforeEach(() => {
    jest.resetModules();

    // Mock Logger
    jest.doMock('universal-bunyan', () => {
      return {
        ...(jest.requireActual('universal-bunyan') as any),
        createLogger: () => loggerMock,
      };
    });

    const restore = require('../../src/commands/restore');
    command = new restore.RestoreCommand();
  });
  afterEach(() => {
    jest.dontMock('universal-bunyan');
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
      jest.spyOn(command, 'addOption');
    });

    it('call addOption()', () => {
      command.addRestoreOptions();
      expect(command.addOption).toBeCalled();
    });
  });

  describe('setRestoreAction', () => {
    beforeEach(() => {
      jest.spyOn(command, 'saveStorageClientInAdvance');
      jest.spyOn(command, 'action');
    });

    it('call action()', () => {
      command.setRestoreAction();
      expect(command.saveStorageClientInAdvance).toBeCalled();
      expect(command.action).toBeCalled();
    });
  });
});

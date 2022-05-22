import { IStorageServiceClient } from '@awesome-database-backup/storage-service-clients';
import { PruneCommand, IPruneCommandOption } from '../../src/commands/prune';

describe('PruneCommand', () => {
  let command: PruneCommand;

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

  beforeEach(() => {
    jest.resetModules();

    // Mock Logger
    jest.doMock('universal-bunyan', () => {
      return {
        ...(jest.requireActual('universal-bunyan') as any),
        createLogger: () => loggerMock,
      };
    });

    const prune = require('../../src/commands/prune');
    command = new prune.PruneCommand();
  });
  afterEach(() => {
    jest.dontMock('universal-bunyan');
  });

  const gcsBareMinumumOptions: IPruneCommandOption = {
    targetBucketUrl: new URL('gs://example.com/bucket/'),
    backupfilePrefix: 'backup',
    deleteDivide: 5,
    deleteTargetDaysLeft: 1,
  };

  describe('prune', () => {
    describe('when options are valid, but "storageServiceClient" is not set in advance', () => {
      const options = gcsBareMinumumOptions;

      beforeEach(() => {
        command.storageServiceClient = null;
      });

      it('reject with error', async() => {
        await expect(command.prune(options))
          .rejects
          .toThrowError('URL scheme is not that of a supported provider.');
      });
    });

    describe('when options are valid and "storageServiceClient" is set in advance', () => {
      beforeEach(() => {
        command.storageServiceClient = gcsClientMock;
      });

      describe('and when isDeleteBackupDay is true and target files exists', () => {
        const options = {
          ...gcsBareMinumumOptions,
          deleteDivide: 1, // everyday isDeleteBackupDay is true
          deleteTargetDaysLeft: 0, // today is not delete target day
        };

        beforeEach(() => {
          command.storageServiceClient = {
            ...gcsClientMock,
            listFiles: jest.fn().mockResolvedValue(['file1']),
          };
        });

        it('return undefined and call storageServiceClient.deleteFile() and logging these file names', async() => {
          await expect(command.prune(options)).resolves.toBe(undefined);
          expect(command.storageServiceClient?.deleteFile).toBeCalled();
          expect(loggerMock.info).toHaveBeenNthCalledWith(1, 'DELETED past backuped file on GCS: gs://example.com/bucket/file1');
        });
      });

      describe('and when isDeleteBackupDay is false', () => {
        const options = {
          ...gcsBareMinumumOptions,
          deleteDivide: 2, // everyday isDeleteBackupDay is true
          deleteTargetDaysLeft: 1, // today is not delete target day
        };

        it('return undefined and not call storageServiceClient.deleteFile() and not logging', async() => {
          await expect(command.prune(options)).resolves.toBe(undefined);
          expect(command.storageServiceClient?.deleteFile).toBeCalledTimes(0);
          expect(loggerMock.info).toBeCalledTimes(0);
        });
      });
    });
  });

  describe('addPruneOptions', () => {
    beforeEach(() => {
      jest.spyOn(command, 'addOption');
    });

    it('call addOption()', () => {
      command.addPruneOptions();
      expect(command.addOption).toBeCalled();
    });
  });

  describe('setPruneAction', () => {
    beforeEach(() => {
      jest.spyOn(command, 'saveStorageClientInAdvance');
      jest.spyOn(command, 'action');
    });

    it('call action()', () => {
      command.setPruneAction();
      expect(command.saveStorageClientInAdvance).toBeCalled();
      expect(command.action).toBeCalled();
    });
  });
});

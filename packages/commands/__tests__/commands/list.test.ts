import {
  vi, afterEach, describe, beforeEach, it, expect,
} from 'vitest';
import { ListCommand } from '../../src/commands/list';

describe('ListCommand', () => {
  let command: ListCommand;

  // Default mock of logger
  const loggerMock = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const storageServiceClientMock = {
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

    const list = await import('../../src/commands/list');
    command = new list.ListCommand();
    command.storageServiceClient = storageServiceClientMock;
  });

  describe('list', () => {
    describe('when options are valid, but "storageServiceClient" is not set in advance', () => {
      const options = {
        targetBucketUrl: new URL('gs://sample.com/bucket'),
      };

      beforeEach(() => {
        command.storageServiceClient = null;
      });

      it('reject with error', async() => {
        await expect(command.list(options))
          .rejects
          .toThrowError('URL scheme is not that of a supported provider.');
      });
    });

    describe('when options are valid and "storageServiceClient" is set in advance', () => {
      beforeEach(() => {
        command.storageServiceClient = storageServiceClientMock;
      });

      describe('and when storageServiceClient.listFiles() return empty', () => {
        const options = {
          targetBucketUrl: new URL('gs://sample.com/bucket'),
        };

        beforeEach(() => {
          command.storageServiceClient = {
            ...storageServiceClientMock,
            listFiles: vi.fn().mockResolvedValue([]),
          };
        });

        it('return undefined and not logging', async() => {
          await expect(command.list(options)).resolves.toBe(undefined);
          expect(loggerMock.info).toBeCalledTimes(0);
        });
      });

      describe('and when storageServiceClient.listFiles() return file names', () => {
        const options = {
          targetBucketUrl: new URL('gs://sample.com/bucket'),
        };

        beforeEach(() => {
          command.storageServiceClient = {
            ...storageServiceClientMock,
            listFiles: vi.fn().mockResolvedValue(['file1']),
          };
        });

        it('return undefined and logging', async() => {
          await expect(command.list(options)).resolves.toBe(undefined);
          expect(loggerMock.info).toHaveBeenNthCalledWith(1, 'There are files below in bucket:');
          expect(loggerMock.info).toHaveBeenNthCalledWith(2, 'file1');
        });
      });
    });
  });

  describe('addListOptions', () => {
    beforeEach(() => {
      vi.spyOn(command, 'addOption');
    });

    it('call addOption()', () => {
      command.addListOptions();
      expect(command.addOption).toBeCalled();
    });
  });

  describe('setListAction', () => {
    beforeEach(() => {
      vi.spyOn(command, 'saveStorageClientInAdvance');
      vi.spyOn(command, 'action');
    });

    it('call action()', () => {
      command.setListAction();
      expect(command.saveStorageClientInAdvance).toBeCalled();
      expect(command.action).toBeCalled();
    });
  });
});

import { ListCommand } from '../../src/commands/list';

describe('ListCommand', () => {
  let command: ListCommand;

  // Default mock of logger
  const loggerMock = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const storageServiceClientMock = {
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

    const list = require('../../src/commands/list');
    command = new list.ListCommand();
    command.storageServiceClient = storageServiceClientMock;
  });
  afterEach(() => {
    jest.dontMock('universal-bunyan');
    jest.resetAllMocks();
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
            listFiles: jest.fn().mockResolvedValue([]),
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
            listFiles: jest.fn().mockResolvedValue(['file1']),
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
      jest.spyOn(command, 'addOption');
    });

    it('call addOption()', () => {
      command.addListOptions();
      expect(command.addOption).toBeCalled();
    });
  });

  describe('setListAction', () => {
    beforeEach(() => {
      jest.spyOn(command, 'saveStorageClientInAdvance');
      jest.spyOn(command, 'action');
    });

    it('call action()', () => {
      command.setListAction();
      expect(command.saveStorageClientInAdvance).toBeCalled();
      expect(command.action).toBeCalled();
    });
  });
});

let restore = require('../../src/commands/restore');

describe('RestoreCommand', () => {
  describe('restore', () => {
    const targetBucketUrl = new URL('gs://sample.com/bucket');
    const options = {
      backupfilePrefix: 'backup',
      deleteDivide: 1,
      deleteTargetDaysLeft: 1,
    };

    const storageServiceClientMock = {
      copyFile: jest.fn().mockReturnValue(['']),
    };
    const restoreDBFuncMock = jest.fn().mockReturnValue({ stdout: '', stderr: '' });

    beforeEach(() => {
      jest.resetModules();
      jest.doMock('../../src/utils/tar', () => {
        const mock = jest.requireActual('../../src/utils/tar');
        mock.expandBZIP2 = jest.fn().mockReturnValue('');
        return mock;
      });
      restore = require('../../src/commands/restore');
    });
    afterEach(() => {
      jest.dontMock('../../src/utils/tar');
    });

    it('return undefined', async() => {
      const restoreCommand = new restore.RestoreCommand();
      restoreCommand.restoreDB = restoreDBFuncMock;
      restoreCommand.storageServiceClient = storageServiceClientMock;
      await expect(restoreCommand.restore(targetBucketUrl, options)).resolves.toBe(undefined);
    });
  });

  describe('addRestoreOptions', () => {
    it('call addOption()', () => {
      const restoreCommand = new restore.RestoreCommand();
      const addOptionMock = jest.fn().mockReturnValue(restoreCommand);
      restoreCommand.addOption = addOptionMock;
      restoreCommand.addRestoreOptions();
      expect(addOptionMock).toBeCalled();
    });
  });

  describe('setRestoreAction', () => {
    it('call action()', () => {
      const restoreCommand = new restore.RestoreCommand();
      const actionMock = jest.fn().mockReturnValue(restoreCommand);
      restoreCommand.action = actionMock;
      restoreCommand.setRestoreAction();
      expect(actionMock).toBeCalled();
    });
  });
});

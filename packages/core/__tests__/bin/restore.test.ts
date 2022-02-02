let restore = require('../../src/bin/restore');

describe('RestoreCommand', () => {
  describe('restore', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.doMock('../../src/utils/tar', () => {
        const actual = jest.requireActual('../../src/utils/tar');
        return {
          ...actual,
          expand: jest.fn().mockReturnValue(''),
        };
      });
      restore = require('../../src/bin/restore');
    });
    afterEach(() => {
      jest.dontMock('../../src/utils/tar');
    });

    it('return undefined', async() => {
      const restoreCommand = new restore.RestoreCommand();
      const storageServiceClientMock = {
        copyFile: jest.fn().mockReturnValue(['']),
      };
      const restoreDatabaseFuncMock = jest.fn().mockReturnValue({ stdout: "", stderr: "" });
      const targetBucketUrl = new URL('gs://sample.com/bucket');
      const options = {
        backupfilePrefix: 'backup',
        deleteDivide: 1,
        deleteTargetDaysLeft: 1,
      };
      await expect(restoreCommand.restore(storageServiceClientMock, restoreDatabaseFuncMock, targetBucketUrl, options)).resolves.toBe(undefined);
    });
  });

  describe('setRestoreArgument', () => {
    it('call argument()', () => {
      const restoreCommand = new restore.RestoreCommand();
      const argumentMock = jest.fn().mockReturnValue(restoreCommand);
      restoreCommand.argument = argumentMock;
      restoreCommand.setRestoreArgument();
      expect(argumentMock).toBeCalled();
    });
  });

  describe('addRestoreOptions', () => {
    it('call option()', () => {
      const restoreCommand = new restore.RestoreCommand();
      const optionMock = jest.fn().mockReturnValue(restoreCommand);
      restoreCommand.option = optionMock;
      restoreCommand.addRestoreOptions();
      expect(optionMock).toBeCalled();
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

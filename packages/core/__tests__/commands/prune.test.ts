const { PruneCommand } = require('../../src/commands/prune');

describe('PruneCommand', () => {
  describe('prune', () => {
    const targetBucketUrl = new URL('gs://sample.com/bucket');
    const options = {
      backupfilePrefix: 'backup',
      deleteDivide: 1,
      deleteTargetDaysLeft: 1,
    };

    const storageServiceClientMock = {
      deleteFile: jest.fn().mockReturnValue(['']),
      listFiles: jest.fn().mockReturnValue(['']),
    };

    it('return undefined', async() => {
      const pruneCommand = new PruneCommand();
      await expect(pruneCommand.prune(storageServiceClientMock, targetBucketUrl, options)).resolves.toBe(undefined);
    });
  });

  describe('addPruneOptions', () => {
    it('call addOption()', () => {
      const pruneCommand = new PruneCommand();
      const addOptionMock = jest.fn().mockReturnValue(pruneCommand);
      pruneCommand.addOption = addOptionMock;
      pruneCommand.addPruneOptions();
      expect(addOptionMock).toBeCalled();
    });
  });

  describe('setPruneAction', () => {
    it('call action()', () => {
      const pruneCommand = new PruneCommand();
      const actionMock = jest.fn().mockReturnValue(pruneCommand);
      pruneCommand.action = actionMock;
      pruneCommand.setPruneAction();
      expect(actionMock).toBeCalled();
    });
  });
});

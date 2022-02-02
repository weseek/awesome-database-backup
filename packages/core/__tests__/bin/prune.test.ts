let prune = require('../../src/bin/prune');

describe('PruneCommand', () => {
  describe('prune', () => {
    it('return undefined', async() => {
      const pruneCommand = new prune.PruneCommand();
      const storageServiceClientMock = {
        deleteFile: jest.fn().mockReturnValue(['']),
        listFiles: jest.fn().mockReturnValue(['']),
      };
      const targetBucketUrl = new URL('gs://sample.com/bucket');
      const options = {
        backupfilePrefix: 'backup',
        deleteDivide: 1,
        deleteTargetDaysLeft: 1,
      };
      await expect(pruneCommand.prune(storageServiceClientMock, targetBucketUrl, options)).resolves.toBe(undefined);
    });
});

  describe('setPruneArgument', () => {
    it('call argument()', () => {
      const pruneCommand = new prune.PruneCommand();
      const argumentMock = jest.fn().mockReturnValue(pruneCommand);
      pruneCommand.argument = argumentMock;
      pruneCommand.setPruneArgument();
      expect(argumentMock).toBeCalled();
    });
  });

  describe('addPruneOptions', () => {
    it('call option()', () => {
      const pruneCommand = new prune.PruneCommand();
      const optionMock = jest.fn().mockReturnValue(pruneCommand);
      pruneCommand.option = optionMock;
      pruneCommand.addPruneOptions();
      expect(optionMock).toBeCalled();
    });
  });

  describe('setPruneAction', () => {
    it('call action()', () => {
      const pruneCommand = new prune.PruneCommand();
      const actionMock = jest.fn().mockReturnValue(pruneCommand);
      pruneCommand.action = actionMock;
      pruneCommand.setPruneAction();
      expect(actionMock).toBeCalled();
    });
  });
});

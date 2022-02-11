const { ListCommand } = require('../../src/commands/list');

describe('ListCommand', () => {
  describe('list', () => {
    const targetBucketUrl = new URL('gs://sample.com/bucket');
    const storageServiceClientMock = {
      listFiles: jest.fn().mockReturnValue(['']),
    };

    it('return undefined', async() => {
      const listCommand = new ListCommand();
      await expect(listCommand.list(storageServiceClientMock, targetBucketUrl)).resolves.toBe(undefined);
    });
  });

  describe('setListArgument', () => {
    it('call argument()', () => {
      const listCommand = new ListCommand();
      const argumentMock = jest.fn().mockReturnValue(listCommand);
      listCommand.argument = argumentMock;
      listCommand.setListArgument();
      expect(argumentMock).toBeCalled();
    });
  });

  describe('addListOptions', () => {
    it('call option()', () => {
      const listCommand = new ListCommand();
      const optionMock = jest.fn().mockReturnValue(listCommand);
      listCommand.option = optionMock;
      listCommand.addListOptions();
      expect(optionMock).toBeCalled();
    });
  });

  describe('setListAction', () => {
    it('call action()', () => {
      const listCommand = new ListCommand();
      const actionMock = jest.fn().mockReturnValue(listCommand);
      listCommand.action = actionMock;
      listCommand.setListAction();
      expect(actionMock).toBeCalled();
    });
  });
});

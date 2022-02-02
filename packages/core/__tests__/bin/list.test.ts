let list = require('../../src/bin/list');

describe('ListCommand', () => {
  describe('list', () => {
    it('return undefined and call dumpDatabaseFunc()', async() => {
      const listCommand = new list.ListCommand();
      const storageServiceClientMock = {
        listFiles: jest.fn().mockReturnValue(['']),
      };
      const targetBucketUrl = new URL('gs://sample.com/bucket');
      await expect(listCommand.list(storageServiceClientMock, targetBucketUrl)).resolves.toBe(undefined);
    });
});

  describe('setListArgument', () => {
    it('call argument()', () => {
      const listCommand = new list.ListCommand();
      const argumentMock = jest.fn().mockReturnValue(listCommand);
      listCommand.argument = argumentMock;
      listCommand.setListArgument();
      expect(argumentMock).toBeCalled();
    });
  });

  describe('addListOptions', () => {
    it('call option()', () => {
      const listCommand = new list.ListCommand();
      const optionMock = jest.fn().mockReturnValue(listCommand);
      listCommand.option = optionMock;
      listCommand.addListOptions();
      expect(optionMock).toBeCalled();
    });
  });

  describe('setListAction', () => {
    it('call action()', () => {
      const listCommand = new list.ListCommand();
      const actionMock = jest.fn().mockReturnValue(listCommand);
      listCommand.action = actionMock;
      listCommand.setListAction();
      expect(actionMock).toBeCalled();
    });
  });
});

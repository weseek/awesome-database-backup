import { StorageServiceClientCommand } from '../../src/commands/common';

describe('StorageServiceClientCommand', () => {
  describe('addStorageOptions', () => {
    it('return undefined and call option()', () => {
      const command = new StorageServiceClientCommand();
      const addOptionMock = jest.fn().mockReturnValue(command);
      command.addOption = addOptionMock;
      expect(command.addStorageOptions()).toBe(command);
      expect(addOptionMock).toBeCalled();
    });
  });

  describe('saveStorageClientInAdvance', () => {

    it('return undefined and call hook()', () => {
      const command = new StorageServiceClientCommand();
      const hookMock = jest.fn().mockReturnValue(command);
      command.hook = hookMock;
      expect(command.saveStorageClientInAdvance()).toBe(command);
      expect(hookMock).toBeCalled();
      expect(command.storageServiceClient).not.toBe(undefined);
    });
  });
});

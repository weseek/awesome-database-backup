import { StorageServiceClientCommand } from '../../src/commands/common';

describe('StorageServiceClientCommand', () => {
  describe('addStorageServiceClientOptions', () => {
    it('return undefined and call option()', () => {
      const command = new StorageServiceClientCommand();
      const addOptionMock = jest.fn().mockReturnValue(command);
      command.addOption = addOptionMock;
      expect(command.addStorageServiceClientOptions()).toBe(command);
      expect(addOptionMock).toBeCalled();
    });
  });

  describe('addStorageServiceClientGenerateHook', () => {

    it('return undefined and call hook()', () => {
      const command = new StorageServiceClientCommand();
      const hookMock = jest.fn().mockReturnValue(command);
      command.hook = hookMock;
      expect(command.addStorageServiceClientGenerateHook()).toBe(command);
      expect(hookMock).toBeCalled();
      expect(command.storageServiceClient).not.toBe(undefined);
    });
  });
});

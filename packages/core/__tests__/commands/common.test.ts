import { StorageServiceClientCommand } from '../../src/commands/common';

describe('StorageServiceClientCommand', () => {
  describe('addStorageOptions', () => {
    it('return own instance and call option()', () => {
      const command = new StorageServiceClientCommand();
      jest.spyOn(command, 'addOption');
      expect(command.addStorageOptions()).toBe(command);
      expect(command.addOption).toBeCalled();
    });
  });

  describe('saveStorageClientInAdvance', () => {

    it('return own instance and call hook()', () => {
      const command = new StorageServiceClientCommand();
      jest.spyOn(command, 'hook');
      expect(command.saveStorageClientInAdvance()).toBe(command);
      expect(command.hook).toBeCalled();
    });
  });
});

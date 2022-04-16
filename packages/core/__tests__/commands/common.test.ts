import { Command } from 'commander';
import { IStorageServiceClient } from '../../src/storage-service-clients/interfaces';
import {
  addStorageServiceClientOptions,
  addStorageServiceClientGenerateHook,
} from '../../src/commands/common';

describe('addStorageServiceClientOptions', () => {
  it('return undefined and call option()', () => {
    const command = new Command();
    const addOptionMock = jest.fn().mockReturnValue(command);
    command.addOption = addOptionMock;
    expect(addStorageServiceClientOptions(command)).toBe(undefined);
    expect(addOptionMock).toBeCalled();
  });
});

describe('addStorageServiceClientGenerateHook', () => {

  it('return undefined and call hook()', () => {
    const command = new Command();
    const hookMock = jest.fn().mockReturnValue(command);
    const storageServiceClientHolder: {
      storageServiceClient: IStorageServiceClient | null,
    } = {
      storageServiceClient: null,
    };
    command.hook = hookMock;
    expect(addStorageServiceClientGenerateHook(command, storageServiceClientHolder)).toBe(undefined);
    expect(hookMock).toBeCalled();
    expect(storageServiceClientHolder.storageServiceClient).not.toBe(undefined);
  });
});

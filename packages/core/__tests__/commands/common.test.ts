import { Command } from 'commander';
import { IStorageServiceClient } from '../../src/interfaces/storage-service-client';
import {
  addStorageServiceClientOptions,
  addStorageServiceClientGenerateHook,
} from '../../src/commands/common';

describe('addStorageServiceClientOptions', () => {
  it('return undefined and call option()', () => {
    const command = new Command();
    const optionMock = jest.fn().mockReturnValue(command);
    command.option = optionMock;
    expect(addStorageServiceClientOptions(command)).toBe(undefined);
    expect(optionMock).toBeCalled();
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

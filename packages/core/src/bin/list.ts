import { EOL } from 'os';
import { Command } from 'commander';

import { IStorageServiceClient } from '../interfaces/storage-service-client';
import {
  addStorageServiceClientOptions,
  addStorageServiceClientGenerateHook,
} from './common';

export async function list(
    storageServiceClient: IStorageServiceClient,
    targetBucketUrl: URL,
): Promise<void> {
  console.log('There are files below in bucket:');
  const files = await storageServiceClient.listFiles(targetBucketUrl.toString());
  console.log(files.join(EOL));
}

export function addListOptions(command: Command): void {
  addStorageServiceClientOptions(command);
}

export function setListAction(
    command: Command,
): void {
  const storageServiceClientHolder: {
    storageServiceClient: IStorageServiceClient | null,
  } = {
    storageServiceClient: null,
  };
  addStorageServiceClientGenerateHook(command, storageServiceClientHolder);

  const action = async(targetBucketUrlString: string) => {
    try {
      if (storageServiceClientHolder.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

      const targetBucketUrl = new URL(targetBucketUrlString);
      await list(
        storageServiceClientHolder.storageServiceClient,
        targetBucketUrl,
      );
    }
    catch (e: any) {
      console.error(e);
    }
  };

  command.action(action);
}

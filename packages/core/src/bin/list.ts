import { EOL } from 'os';
import { Command } from 'commander';

import { IStorageServiceClient } from '../interfaces/storage-service-client';
import {
  addStorageServiceClientOptions,
  addStorageServiceClientGenerateHook,
} from './common';

export class ListCommand extends Command {

  async list(
      storageServiceClient: IStorageServiceClient,
      targetBucketUrl: URL,
  ): Promise<void> {
    console.log('There are files below in bucket:');
    const files = await storageServiceClient.listFiles(targetBucketUrl.toString());
    console.log(files.join(EOL));
  }

  setListArgument(): ListCommand {
    return this.argument('<TARGET_BUCKET_URL>', 'URL of target bucket');
  }

  addListOptions(): ListCommand {
    addStorageServiceClientOptions(this);
    return this;
  }

  setListAction(): ListCommand {
    const storageServiceClientHolder: {
      storageServiceClient: IStorageServiceClient | null,
    } = {
      storageServiceClient: null,
    };
    addStorageServiceClientGenerateHook(this, storageServiceClientHolder);

    const action = async(targetBucketUrlString: string) => {
      try {
        if (storageServiceClientHolder.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

        const targetBucketUrl = new URL(targetBucketUrlString);
        await this.list(
          storageServiceClientHolder.storageServiceClient,
          targetBucketUrl,
        );
      }
      catch (e: any) {
        console.error(e);
      }
    };

    return this.action(action);
  }

}

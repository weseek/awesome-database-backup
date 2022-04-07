import { EOL } from 'os';
import { Command } from 'commander';
import { IStorageServiceClient } from '../storage-service-clients/interfaces';
import {
  addStorageServiceClientOptions,
  addStorageServiceClientGenerateHook,
} from './common';
import loggerFactory from '../logger/factory';

const logger = loggerFactory('mongodb-awesome-core');

/**
 * Define actions, options, and arguments that are commonly required for list command from the CLI, regardless of the database type.
 *
 * Call setListAction(), addListOptions() and setListArgument().
 *
 * If necessary, you can customize it by using the Command's methods, such as adding options by using option() and help messages by using addHelpText().
 */
export class ListCommand extends Command {

  async list(
      storageServiceClient: IStorageServiceClient,
      targetBucketUrl: URL,
  ): Promise<void> {
    logger.info('There are files below in bucket:');
    const files = await storageServiceClient.listFiles(targetBucketUrl.toString());
    logger.info(files.join(EOL));
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
        logger.error(e);
        throw e;
      }
    };

    return this.action(action);
  }

}

export { IListCLIOption } from './interfaces';
export default ListCommand;

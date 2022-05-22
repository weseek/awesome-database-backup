import { EOL } from 'os';
import { StorageServiceClientCommand } from './common';
import loggerFactory from '../logger/factory';
import { IListCommandOption } from './interfaces';

const logger = loggerFactory('list');

/**
 * Define actions, options, and arguments that are commonly required for list command from the CLI, regardless of the database type.
 *
 * Call setListAction() and addListOptions().
 *
 * If necessary, you can customize it by using the Command's methods, such as adding options by using option() and help messages by using addHelpText().
 */
export class ListCommand extends StorageServiceClientCommand {

  async list(options: IListCommandOption): Promise<void> {
    if (this.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

    const files = await this.storageServiceClient.listFiles(options.targetBucketUrl.toString());
    if (files.length > 0) {
      logger.info('There are files below in bucket:');
      logger.info(files.join(EOL));
    }
  }

  addListOptions(): this {
    return this
      .addStorageOptions();
  }

  setListAction(): this {
    return this
      .saveStorageClientInAdvance()
      .action(this.list);
  }

}

export { IListCommandOption } from './interfaces';
export default ListCommand;

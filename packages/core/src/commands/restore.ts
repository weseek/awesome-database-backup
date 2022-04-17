import { format } from 'date-fns';
import { basename, join } from 'path';
import { Command, Option } from 'commander';
import { EOL } from 'os';
import { expandBZIP2 } from '../utils/tar';
import { IStorageServiceClient } from '../storage-service-clients/interfaces';
import { IRestoreCommandOption } from './interfaces';
import {
  addStorageServiceClientOptions,
  addStorageServiceClientGenerateHook,
} from './common';
import loggerFactory from '../logger/factory';

const logger = loggerFactory('mongodb-awesome-backup');
const tmp = require('tmp');

/**
 * Define actions, options, and arguments that are commonly required for restore command from the CLI, regardless of the database type.
 *
 * Call setRestoreAction() with the function to restore data for each database (ex. execute `psql` for PostgreSQL).
 * Also call addRestoreOptions().
 *
 * If necessary, you can customize it by using the Command's methods, such as adding options by using option() and help messages by using addHelpText().
 */
export class RestoreCommand extends Command {

  async restore(
      storageServiceClient: IStorageServiceClient,
      restoreDatabaseFunc: (sourcePath: string, restoreToolOptions?: string) => Promise<{ stdout: string, stderr: string }>,
      targetBucketUrl: URL,
      options: IRestoreCommandOption,
  ): Promise<void> {
    logger.info(`=== ${basename(__filename)} started at ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);

    tmp.setGracefulCleanup();
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    const backupFilePath = join(tmpdir.name, basename(targetBucketUrl.pathname));
    await storageServiceClient.copyFile(targetBucketUrl.toString(), backupFilePath);

    logger.info(`expands ${backupFilePath}...`);
    const { expandedPath } = await expandBZIP2(backupFilePath);
    const { stdout, stderr } = await restoreDatabaseFunc(expandedPath, options.restoreToolOptions);
    if (stdout) stdout.split(EOL).forEach(line => logger.info(line));
    if (stderr) stderr.split(EOL).forEach(line => logger.warn(line));
  }

  addRestoreOptions(): RestoreCommand {
    addStorageServiceClientOptions(this);
    return this
      .addOption(
        new Option(
          '--restore-tool-options <OPTIONS_STRING>',
          'pass options to restore tool exec',
        )
          .env('RESTORE_TOOL_OPTIONS'),
      );
  }

  setRestoreAction(
      restoreDatabaseFunc: (sourcePath: string, restoreToolOptions?: string) => Promise<{ stdout: string, stderr: string }>,
  ): RestoreCommand {
    const storageServiceClientHolder: {
      storageServiceClient: IStorageServiceClient | null,
    } = {
      storageServiceClient: null,
    };
    addStorageServiceClientGenerateHook(this, storageServiceClientHolder);

    const action = async(options: IRestoreCommandOption) => {
      try {
        if (storageServiceClientHolder.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

        const targetBucketUrl = new URL(options.targetBucketUrl);
        await this.restore(
          storageServiceClientHolder.storageServiceClient,
          restoreDatabaseFunc,
          targetBucketUrl,
          options,
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

export { IRestoreCommandOption } from './interfaces';
export default RestoreCommand;

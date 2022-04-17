import { format, subDays } from 'date-fns';
import { Option } from 'commander';
import { IStorageServiceClient } from '../storage-service-clients/interfaces';
import { IPruneCommandOption } from './interfaces';
import { StorageServiceClientCommand } from './common';
import loggerFactory from '../logger/factory';

const logger = loggerFactory('mongodb-awesome-backup');

/**
 * Define actions, options, and arguments that are commonly required for prune command from the CLI, regardless of the database type.
 *
 * Call setPruneAction(), addPruneOptions() and setPruneArgument().
 *
 * If necessary, you can customize it by using the Command's methods, such as adding options by using option() and help messages by using addHelpText().
 */
export class PruneCommand extends StorageServiceClientCommand {

  async prune(
      storageServiceClient: IStorageServiceClient,
      targetBucketUrl: URL,
      options: IPruneCommandOption,
  ): Promise<void> {
    const secondsPerDay = 60 * 60 * 24;
    const targetBackupDay = subDays(Date.now(), options.deleteTargetDaysLeft);
    const isDeleteBackupDay = (Math.trunc(targetBackupDay.getTime() / 1000 / secondsPerDay) % options.deleteDivide === 0);
    if (!isDeleteBackupDay) {
      // do nothing
      return;
    }

    const targetBackupUrlPrefix = new URL(`${options.backupfilePrefix}-${format(targetBackupDay, 'yyyyMMdd')}`, targetBucketUrl).toString();
    const targetBackupFiles = await storageServiceClient.listFiles(targetBackupUrlPrefix, { exactMatch: false, absolutePath: false });
    for (const targetBackup of targetBackupFiles) {
      const targetBackupUrl = new URL(targetBackup, targetBucketUrl);
      storageServiceClient.deleteFile(targetBackupUrl.toString());
      logger.info(`DELETED past backuped file on ${storageServiceClient.name}: ${targetBackupUrl}`);
    }
  }

  addPruneOptions(): this {
    return this
      .addStorageOptions()
      .addOption(
        new Option('--backupfile-prefix <BACKUPFILE_PREFIX>', 'Prefix of backup file.')
          .default('backup')
          .env('BACKUPFILE_PREFIX'),
      )
      .addOption(
        new Option('--delete-divide <DELETE_DIVIDE>', 'delete divide')
          .argParser(parseInt)
          .default(3)
          .env('DELETE_DIVIDE'),
      )
      .addOption(
        new Option('--delete-target-days-left <DELETE_TARGET_DAYS_LEFT>', 'How many days ago to be deleted')
          .argParser(parseInt)
          .default(4)
          .env('DELETE_TARGET_DAYS_LEFT'),
      );
  }

  setPruneAction(): this {
    const action = async(options: IPruneCommandOption) => {
      try {
        if (this.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

        const targetBucketUrl = new URL(options.targetBucketUrl);
        await this.prune(
          this.storageServiceClient,
          targetBucketUrl,
          options,
        );
      }
      catch (e: any) {
        logger.error(e);
        throw e;
      }
    };

    return this
      .saveStorageClientInAdvance()
      .action(action);
  }

}

export { IPruneCommandOption } from './interfaces';
export default PruneCommand;

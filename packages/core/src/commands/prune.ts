import { format, subDays } from 'date-fns';
import { Command } from 'commander';

import { IStorageServiceClient } from '../storage-service-clients/interfaces';
import { IPruneCLIOption } from './interfaces';
import {
  addStorageServiceClientOptions,
  addStorageServiceClientGenerateHook,
} from './common';
import loggerFactory from '../logger/factory';

const logger = loggerFactory('mongodb-awesome-backup');

/**
 * Define actions, options, and arguments that are commonly required for prune command from the CLI, regardless of the database type.
 *
 * Call setPruneAction(), addPruneOptions() and setPruneArgument().
 *
 * If necessary, you can customize it by using the Command's methods, such as adding options by using option() and help messages by using addHelpText().
 */
export class PruneCommand extends Command {

  async prune(
      storageServiceClient: IStorageServiceClient,
      targetBucketUrl: URL,
      options: IPruneCLIOption,
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

  setPruneArgument(): PruneCommand {
    return this.argument('<TARGET_BUCKET_URL>', 'URL of target bucket');
  }

  addPruneOptions(): PruneCommand {
    addStorageServiceClientOptions(this);
    return this
      .option('--backupfile-prefix <BACKUPFILE_PREFIX>', 'Prefix of backup file.', 'backup')
      .option('--delete-divide <DELETE_DIVIDE>', 'delete divide', parseInt, 3)
      .option('--delete-target-days-left <DELETE_TARGET_DAYS_LEFT>', 'How many days ago to be deleted', parseInt, 4);
  }

  setPruneAction(): PruneCommand {
    const storageServiceClientHolder: {
      storageServiceClient: IStorageServiceClient | null,
    } = {
      storageServiceClient: null,
    };
    addStorageServiceClientGenerateHook(this, storageServiceClientHolder);

    const action = async(targetBucketUrlString: string, otions: IPruneCLIOption) => {
      try {
        if (storageServiceClientHolder.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

        const targetBucketUrl = new URL(targetBucketUrlString);
        await this.prune(
          storageServiceClientHolder.storageServiceClient,
          targetBucketUrl,
          otions,
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

export { IPruneCLIOption } from './interfaces';
export default PruneCommand;

import { format, subDays } from 'date-fns';
import { Command } from 'commander';

import { IStorageServiceClient } from '../interfaces/storage-service-client';
import {
  addStorageServiceClientOptions,
  addStorageServiceClientGenerateHook,
  ICommonCLIOption,
} from './common';

/* Prune command option types */
export declare interface IPruneCLIOption extends ICommonCLIOption {
  backupfilePrefix: string,
  deleteDivide: number,
  deleteTargetDaysLeft: number,
}

export async function prune(
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
    console.log(`DELETED past backuped file on ${storageServiceClient.name}: ${targetBackupUrl}`);
  }
}

export function addPruneOptions(command: Command): void {
  addStorageServiceClientOptions(command);
  command
    .option('--backupfile-prefix <BACKUPFILE_PREFIX>', 'Prefix of backup file.', 'backup')
    .option('--delete-divide <DELETE_DIVIDE>', 'delete divide', parseInt, 3)
    .option('--delete-target-days-left <DELETE_TARGET_DAYS_LEFT>', 'How many days ago to be deleted', parseInt, 4)
}

export function setPruneAction(
    command: Command,
): void {
  const storageServiceClientHolder: {
    storageServiceClient: IStorageServiceClient | null,
  } = {
    storageServiceClient: null,
  };
  addStorageServiceClientGenerateHook(command, storageServiceClientHolder);

  const action = async(targetBucketUrlString: string, otions: IPruneCLIOption) => {
    try {
      if (storageServiceClientHolder.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

      const targetBucketUrl = new URL(targetBucketUrlString);
      await prune(
        storageServiceClientHolder.storageServiceClient,
        targetBucketUrl,
        otions,
      );
    }
    catch (e: any) {
      console.error(e);
    }
  };

  command.action(action);
}

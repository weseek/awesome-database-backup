import { format } from 'date-fns';
import { basename, join } from 'path';
import { Command } from 'commander';

import { expand } from '../utils/tar';
import { IStorageServiceClient } from '../interfaces/storage-service-client';
import {
  addStorageServiceClientOptions,
  addStorageServiceClientGenerateHook,
  ICommonCLIOption,
} from './common';

const tmp = require('tmp');

/* Restore command option types */
export declare interface IRestoreCLIOption {
  awsRegion: string
  awsAccessKeyId: string,
  awsSecretAccessKey: string,
  gcpProjectId: string,
  gcpClientEmail: string,
  gcpPrivateKey: string,
  gcpServiceAccountKeyJsonPath: string,
  restoreToolOptions: string,
}

export async function restore(
    storageServiceClient: IStorageServiceClient,
    restoreDatabaseFunc: (sourcePath: string, restoreToolOptions?: string) => Promise<{ stdout: string, stderr: string }>,
    targetBucketUrl: URL,
    options: IRestoreCLIOption,
): Promise<void> {
  console.log(`=== ${basename(__filename)} started at ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);

  tmp.setGracefulCleanup();
  const tmpdir = tmp.dirSync({ unsafeCleanup: true });
  const backupFilePath = join(tmpdir.name, basename(targetBucketUrl.pathname));
  await storageServiceClient.copyFile(targetBucketUrl.toString(), backupFilePath);

  console.log(`expands ${backupFilePath}...`);
  const { expandedPath } = await expand(backupFilePath);
  const { stdout, stderr } = await restoreDatabaseFunc(expandedPath, options.restoreToolOptions);
  if (stdout) console.log(stdout);
  if (stderr) console.warn(stderr);
}

export function addRestoreOptions(command: Command): void {
  addStorageServiceClientOptions(command);
  command
    .option('--restore-tool-options <OPTIONS_STRING>', 'pass options to restore tool exec');
}

export function setRestoreAction(
    restoreDatabaseFunc: (sourcePath: string, restoreToolOptions?: string) => Promise<{ stdout: string, stderr: string }>,
    command: Command,
): void {
  const storageServiceClientHolder: {
    storageServiceClient: IStorageServiceClient | null,
  } = {
    storageServiceClient: null,
  };
  addStorageServiceClientGenerateHook(command, storageServiceClientHolder);

  const action = async(targetBucketUrlString: string, otions: IRestoreCLIOption) => {
    try {
      if (storageServiceClientHolder.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

      const targetBucketUrl = new URL(targetBucketUrlString);
      await restore(
        storageServiceClientHolder.storageServiceClient,
        restoreDatabaseFunc,
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

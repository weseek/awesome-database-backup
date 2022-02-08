import { format } from 'date-fns';
import { basename, join } from 'path';
import { Command } from 'commander';

import axios, { AxiosError } from 'axios';
import { compress } from '../utils/tar';
import { IStorageServiceClient } from '../interfaces/storage-service-client';
import {
  addStorageServiceClientOptions,
  addStorageServiceClientGenerateHook,
  ICommonCLIOption,
} from './common';
import loggerFactory from '../services/logger';

const schedule = require('node-schedule');
const tmp = require('tmp');
const axiosRetry = require('axios-retry');
const EventEmitter = require('events');

const logger = loggerFactory('mongodb-awesome-backup');
const backupEventEmitter = new EventEmitter();
const _EXIT_BACKUP = 'AWSOME_BACKUP_EXIT_BACKUP';

/* Backup command option types */
export declare interface IBackupCLIOption extends ICommonCLIOption {
  backupfilePrefix: string,
  cronmode?: boolean,
  cronExpression?: string,
  healthchecksUrl?: string,
  backupToolOptions?: string,
}

export class BackupCommand extends Command {

  async backupOnce(
      storageServiceClient: IStorageServiceClient,
      dumpDatabaseFunc: (backupFilePath: string, backupToolOptions?: string) => Promise<{ stdout: string, stderr: string }>,
      targetBucketUrl: URL,
      options: IBackupCLIOption,
  ): Promise<void> {
    logger.info(`=== ${basename(__filename)} started at ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);

    if (options.healthchecksUrl != null && backupEventEmitter.listenerCount(_EXIT_BACKUP) === 0) {
      const healthChecker = async() => {
        const healthchecksUrl = new URL(options.healthchecksUrl as string);
        axiosRetry(axios, { retries: 3 });
        await axios
          .get(healthchecksUrl.toString())
          .catch((e: AxiosError) => {
            logger.info(`Cannot GET ${healthchecksUrl.toString()}: ${e.toString()}`);
          });
      };
      backupEventEmitter.addListener(_EXIT_BACKUP, healthChecker);
    }

    tmp.setGracefulCleanup();
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    const backupFilePath = join(tmpdir.name, `${options.backupfilePrefix}-${format(Date.now(), 'yyyyMMddHHmmss')}`);

    logger.info(`backup ${backupFilePath}...`);
    const { stdout, stderr } = await dumpDatabaseFunc(backupFilePath, options.backupToolOptions);
    if (stdout) logger.info(stdout);
    if (stderr) logger.warn(stderr);

    const { compressedFilePath } = await compress(backupFilePath);
    await storageServiceClient.copyFile(compressedFilePath, targetBucketUrl.toString());

    backupEventEmitter.emit(_EXIT_BACKUP);
  }

  async backupCronMode(
      storageServiceClient: IStorageServiceClient,
      dumpDatabaseFunc: (backupFilePath: string, backupToolOptions?: string) => Promise<{ stdout: string, stderr: string }>,
      targetBucketUrl: URL,
      options: IBackupCLIOption,
  ): Promise<void> {
    logger.info(`=== started in cron mode ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);
    await schedule.scheduleJob(
      options.cronExpression,
      async() => {
        await this.backupOnce(storageServiceClient, dumpDatabaseFunc, targetBucketUrl, options);
      },
    );
  }

  setBackupArgument(): BackupCommand {
    return this.argument('<TARGET_BUCKET_URL>', 'URL of target bucket');
  }

  addBackupOptions(): BackupCommand {
    addStorageServiceClientOptions(this);
    return this
      .option('--backupfile-prefix <BACKUPFILE_PREFIX>', 'Prefix of backup file.', 'backup')
      .option('--cronmode', 'Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically.', false)
      .option('--cron-expression <CRON_EXPRESSION>', 'Cron expression (ex. CRON_EXPRESSION="0 4 * * *" if you want to run at 4:00 every day)')
      .option('--healthcheck-url <HEALTHCHECK_URL>', 'URL that gets called after a successful backup (eg. https://healthchecks.io)')
      .option('--backup-tool-options <OPTIONS_STRING>', 'pass options to backup tool exec (ex. "--host db.example.com --username admin")');
  }

  setBackupAction(
      dumpDatabaseFunc: (backupFilePath: string, backupToolOptions?: string) => Promise<{ stdout: string, stderr: string }>,
  ): BackupCommand {
    const storageServiceClientHolder: {
      storageServiceClient: IStorageServiceClient | null,
    } = {
      storageServiceClient: null,
    };
    addStorageServiceClientGenerateHook(this, storageServiceClientHolder);

    const action = async(targetBucketUrlString: string, options: IBackupCLIOption) => {
      try {
        if (options.cronmode && options.cronExpression == null) {
          logger.error('The option "--cron-expression" must be specified in cron mode.');
          return;
        }
        if (storageServiceClientHolder.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

        const targetBucketUrl = new URL(targetBucketUrlString);
        const actionImpl = (options.cronmode ? this.backupCronMode : this.backupOnce);
        await actionImpl(
          storageServiceClientHolder.storageServiceClient,
          dumpDatabaseFunc,
          targetBucketUrl,
          options,
        );
      }
      catch (e: any) {
        logger.error(e);
      }
    };

    return this.action(action);
  }

}

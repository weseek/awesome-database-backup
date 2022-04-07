import { format } from 'date-fns';
import { basename, join } from 'path';
import { Command } from 'commander';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { compressBZIP2 } from '../utils/tar';
import { IStorageServiceClient } from '../storage-service-clients/interfaces';
import { IBackupCLIOption } from './interfaces';
import {
  addStorageServiceClientOptions,
  addStorageServiceClientGenerateHook,
} from './common';
import loggerFactory from '../logger/factory';

const schedule = require('node-schedule');
const tmp = require('tmp');

const logger = loggerFactory('mongodb-awesome-backup');

/**
 * Define actions, options, and arguments that are commonly required for backup command from the CLI, regardless of the database type.
 *
 * Call setBackupAction() with the function to dump data for each database (ex. execute `psdump_all` for PostgreSQL).
 * Also call addBackupOptions() and setBackupArgument().
 *
 * If necessary, you can customize it by using the Command's methods, such as adding options by using option() and help messages by using addHelpText().
 */
export class BackupCommand extends Command {

  async backupOnce(
      storageServiceClient: IStorageServiceClient,
      dumpDatabaseFunc: (backupFilePath: string, backupToolOptions?: string) => Promise<{ stdout: string, stderr: string }>,
      targetBucketUrl: URL,
      options: IBackupCLIOption,
  ): Promise<void> {
    logger.info(`=== ${basename(__filename)} started at ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);

    tmp.setGracefulCleanup();
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    const backupFilePath = join(tmpdir.name, `${options.backupfilePrefix}-${format(Date.now(), 'yyyyMMddHHmmss')}`);

    logger.info(`backup ${backupFilePath}...`);
    const { stdout, stderr } = await dumpDatabaseFunc(backupFilePath, options.backupToolOptions);
    if (stdout) logger.info(stdout);
    if (stderr) logger.warn(stderr);

    const { compressedFilePath } = await compressBZIP2(backupFilePath);
    await storageServiceClient.copyFile(compressedFilePath, targetBucketUrl.toString());

    await this.processEndOfBackupOnce(options);
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

  /**
   * Process executed at the end of BackupOnce()
   */
  async processEndOfBackupOnce(options: IBackupCLIOption): Promise<void> {
    if (options.healthchecksUrl == null) return;

    try {
      const healthchecksUrl = new URL(options.healthchecksUrl as string);
      axiosRetry(axios, { retries: 3 });
      await axios.get(healthchecksUrl.toString());
    }
    catch (e: any) {
      logger.warn(`Cannot access to URL for health check. ${e.toString()}`);
    }
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
        if (options.cronmode && options.cronExpression == null) throw new Error('The option "--cron-expression" must be specified in cron mode.');
        if (storageServiceClientHolder.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

        const targetBucketUrl = new URL(targetBucketUrlString);
        const actionImpl = (options.cronmode ? this.backupCronMode : this.backupOnce);
        await actionImpl.bind(this)(
          storageServiceClientHolder.storageServiceClient,
          dumpDatabaseFunc,
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

export { IBackupCLIOption } from './interfaces';
export default BackupCommand;

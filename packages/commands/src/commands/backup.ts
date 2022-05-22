import { format } from 'date-fns';
import { basename } from 'path';
import { Option } from 'commander';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { EOL } from 'os';
import { IBackupCommandOption } from './interfaces';
import { StorageServiceClientCommand } from './common';
import loggerFactory from '../logger/factory';

const schedule = require('node-schedule');

const logger = loggerFactory('backup');

/**
 * Define actions, options, and arguments that are commonly required for backup command from the CLI, regardless of the database type.
 *
 * Implement dumpDB() to dump data for each database (ex. execute `psdump_all` for PostgreSQL).
 * Also call setBackupAction() and addBackupOptions().
 *
 * If necessary, you can customize it by using the Command's methods, such as adding options by using option() and help messages by using addHelpText().
 */
export class BackupCommand extends StorageServiceClientCommand {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async dumpDB(_options: IBackupCommandOption): Promise<{ stdout: string, stderr: string, dbDumpFilePath: string }> {
    throw new Error('Method not implemented.');
  }

  async processDBDumpFile(dbDumpFilePath: string): Promise<string> {
    // If you want to add compression or other processing to the DB dumped file, override the process.
    // By default, nothing is done.
    return dbDumpFilePath;
  }

  async execBackupAction(options: IBackupCommandOption): Promise<void> {
    const backupOnceOrCronMode = options.cronmode
      ? this.backupCronMode.bind(this)
      : this.backupOnce.bind(this);
    await backupOnceOrCronMode(options);
  }

  async backupOnce(options: IBackupCommandOption): Promise<void> {
    if (this.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

    logger.info(`=== ${basename(__filename)} started at ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);

    const { stdout, stderr, dbDumpFilePath } = await this.dumpDB(options);
    if (stdout) stdout.split(EOL).forEach(line => logger.info(line));
    if (stderr) stderr.split(EOL).forEach(line => logger.warn(line));

    const compressedFilePath = await this.processDBDumpFile(dbDumpFilePath);
    await this.storageServiceClient.copyFile(compressedFilePath, options.targetBucketUrl.toString());

    await this.processEndOfBackupOnce(options);
  }

  async backupCronMode(options: IBackupCommandOption): Promise<void> {
    logger.info(`=== started in cron mode ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);
    await schedule.scheduleJob(
      options.cronmode,
      async() => {
        await this.backupOnce(options);
      },
    );
  }

  /**
   * Process executed at the end of BackupOnce()
   */
  async processEndOfBackupOnce(options: IBackupCommandOption): Promise<void> {
    if (options.healthchecksUrl == null) return;

    try {
      axiosRetry(axios, { retries: 3 });
      await axios.get(options.healthchecksUrl.toString());
    }
    catch (e: any) {
      logger.warn(`Cannot access to URL for health check. ${e.toString()}`);
      // Cases where the health check URL cannot be accessed do not essentially affect the backup process.
      // Therefore, the exception is not re-thrown.
    }
  }

  addBackupOptions(): this {
    return this
      .addStorageOptions()
      .addOption(
        new Option(
          '--backupfile-prefix <BACKUPFILE_PREFIX>',
          'Prefix of backup file.',
        )
          .default('backup')
          .env('BACKUPFILE_PREFIX'),
      )
      .addOption(
        new Option(
          '--cronmode <CRON_EXPRESSION>',
          'Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically.'
          + '(ex. CRON_EXPRESSION="0 4 * * *" if you want to run at 4:00 every day)',
        )
          .env('CRON_EXPRESSION'),
      )
      .addOption(
        new Option(
          '--healthcheck-url <HEALTHCHECK_URL>',
          'URL that gets called after a successful backup (eg. https://healthchecks.io)',
        )
          .argParser(value => new URL(value))
          .env('HEALTHCHECKS_URL'),
      )
      .addOption(
        new Option(
          '--backup-tool-options <OPTIONS_STRING>',
          'pass options to backup tool exec (ex. "--host db.example.com --username admin")',
        )
          .env('BACKUP_TOOL_OPTIONS'),
      );
  }

  setBackupAction(): this {
    return this
      .saveStorageClientInAdvance()
      .action(this.execBackupAction);
  }

}

export { IBackupCommandOption } from './interfaces';
export default BackupCommand;

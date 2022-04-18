import { format } from 'date-fns';
import { basename, join } from 'path';
import { Option } from 'commander';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { EOL } from 'os';
import { compressBZIP2 } from '../utils/tar';
import { IBackupCommandOption } from './interfaces';
import { StorageServiceClientCommand } from './common';
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
export class BackupCommand extends StorageServiceClientCommand {

  async dumpDB(destinationPath: string, userSpecifiedOption?: string): Promise<{ stdout: string, stderr: string }> {
    throw new Error('Method not implemented.');
  }

  async backup(options: IBackupCommandOption): Promise<void> {
    try {
      const backupOnceOrCronMode = options.cronmode
        ? this.backupCronMode.bind(this)
        : this.backupOnce.bind(this);
      await backupOnceOrCronMode(options);
    }
    catch (e: any) {
      logger.error(e.toString());
      throw e;
    }
  }

  async backupOnce(options: IBackupCommandOption): Promise<void> {
    if (this.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

    logger.info(`=== ${basename(__filename)} started at ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);

    tmp.setGracefulCleanup();
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    const backupFilePath = join(tmpdir.name, `${options.backupfilePrefix}-${format(Date.now(), 'yyyyMMddHHmmss')}`);

    logger.info(`backup ${backupFilePath}...`);
    const { stdout, stderr } = await this.dumpDB(backupFilePath, options.backupToolOptions);
    if (stdout) stdout.split(EOL).forEach(line => logger.info(line));
    if (stderr) stderr.split(EOL).forEach(line => logger.warn(line));

    const { compressedFilePath } = await compressBZIP2(backupFilePath);
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
      .action(options => this.backup(options));
  }

}

export { IBackupCommandOption } from './interfaces';
export default BackupCommand;

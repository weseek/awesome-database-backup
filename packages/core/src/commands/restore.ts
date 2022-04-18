import { format } from 'date-fns';
import { basename, join } from 'path';
import { Option } from 'commander';
import { EOL } from 'os';
import { expandBZIP2 } from '../utils/tar';
import { IRestoreCommandOption } from './interfaces';
import { StorageServiceClientCommand } from './common';
import loggerFactory from '../logger/factory';

const logger = loggerFactory('mongodb-awesome-backup');
const tmp = require('tmp');

/**
 * Define actions, options, and arguments that are commonly required for restore command from the CLI, regardless of the database type.
 *
 * Implement restoreDB() to restore data for each database (ex. execute `psql` for PostgreSQL).
 * Also call addRestoreOptions().
 *
 * If necessary, you can customize it by using the Command's methods, such as adding options by using option() and help messages by using addHelpText().
 */
export class RestoreCommand extends StorageServiceClientCommand {

  async restoreDB(sourcePath: string, userSpecifiedOption?: string): Promise<{ stdout: string, stderr: string }> {
    throw new Error('Method not implemented.');
  }

  async restore(options: IRestoreCommandOption): Promise<void> {
    if (this.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

    logger.info(`=== ${basename(__filename)} started at ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);

    tmp.setGracefulCleanup();
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    const backupFilePath = join(tmpdir.name, basename(options.targetBucketUrl.pathname));
    await this.storageServiceClient.copyFile(options.targetBucketUrl.toString(), backupFilePath);

    logger.info(`expands ${backupFilePath}...`);
    const { expandedPath } = await expandBZIP2(backupFilePath);
    const { stdout, stderr } = await this.restoreDB(expandedPath, options.restoreToolOptions);
    if (stdout) stdout.split(EOL).forEach(line => logger.info(line));
    if (stderr) stderr.split(EOL).forEach(line => logger.warn(line));
  }

  addRestoreOptions(): this {
    return this
      .addStorageOptions()
      .addOption(
        new Option(
          '--restore-tool-options <OPTIONS_STRING>',
          'pass options to restore tool exec',
        )
          .env('RESTORE_TOOL_OPTIONS'),
      );
  }

  setRestoreAction(): RestoreCommand {
    return this
      .saveStorageClientInAdvance()
      .action(this.restore);
  }

}

export { IRestoreCommandOption } from './interfaces';
export default RestoreCommand;

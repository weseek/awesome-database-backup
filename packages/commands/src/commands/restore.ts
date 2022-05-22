import { format } from 'date-fns';
import {
  basename, dirname, extname, join,
} from 'path';
import { Option } from 'commander';
import { EOL } from 'os';
import { createGunzip } from 'zlib';
import { Transform } from 'stream';
import * as StreamPromises from 'stream/promises';
import { createReadStream } from 'fs';
import { IRestoreCommandOption } from './interfaces';
import { StorageServiceClientCommand } from './common';
import loggerFactory from '../logger/factory';

const logger = loggerFactory('restore');
const tmp = require('tmp');
const tar = require('tar');
const bz2 = require('unbzip2-stream');

/**
 * Define actions, options, and arguments that are commonly required for restore command from the CLI, regardless of the database type.
 *
 * Implement restoreDB() to restore data for each database (ex. execute `psql` for PostgreSQL).
 * Also call setRestoreAction() and addRestoreOptions().
 *
 * If necessary, you can customize it by using the Command's methods, such as adding options by using option() and help messages by using addHelpText().
 */
export class RestoreCommand extends StorageServiceClientCommand {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async restoreDB(_sourcePath: string, _userSpecifiedOption?: string): Promise<{ stdout: string, stderr: string }> {
    throw new Error('Method not implemented.');
  }

  /**
   * Extracts compressed file to the same directory.
   *
   * If the expantion succeeds, it returns the path to the expaneded file or directory.
   * Extracted file or directory name is assumed same as compressed file name.
   * (ex. Assume that file "some.tar.gz" is extracted to a directory "some")
   */
  async processBackupFile(backupFilePath: string): Promise<string> {
    const processors: Record<string, Transform> = {
      '.gz': createGunzip(),
      '.bz2': bz2(),
      '.tar': new tar.Unpack({ cwd: dirname(backupFilePath) }),
    };

    let newBackupFilePath = backupFilePath;
    const streams = [];

    streams.push(createReadStream(backupFilePath));
    while (extname(newBackupFilePath) !== '') {
      const ext = extname(newBackupFilePath);
      if (processors[ext] == null) throw new Error(`Extension ${ext} is not supported`);

      streams.push(processors[ext]);

      newBackupFilePath = newBackupFilePath.slice(0, -ext.length);
    }

    return StreamPromises
      .pipeline(streams)
      .then(() => newBackupFilePath);
  }

  async restore(options: IRestoreCommandOption): Promise<void> {
    if (this.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

    logger.info(`=== ${basename(__filename)} started at ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);

    tmp.setGracefulCleanup();
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    const backupFilePath = join(tmpdir.name, basename(options.targetBucketUrl.pathname));
    await this.storageServiceClient.copyFile(options.targetBucketUrl.toString(), backupFilePath);

    logger.info(`expands ${backupFilePath}...`);
    const expandedPath = await this.processBackupFile(backupFilePath);
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

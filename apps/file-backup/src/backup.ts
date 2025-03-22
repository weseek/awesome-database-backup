/**
 * An executable file that stores files to a storage service.
 * Execute with --help to see usage instructions.
 */
import { format } from 'date-fns';
import { exec as execOriginal, spawn } from 'child_process';
import { BackupCommand, IBackupCommandOption } from '@awesome-database-backup/commands';
import { join } from 'path';
import { promisify } from 'util';
import { Readable } from 'stream';
import loggerFactory from './logger/factory';

const version = require('@awesome-database-backup/file-backup/package.json').version;
const tmp = require('tmp');

const exec = promisify(execOriginal);
const logger = loggerFactory('file-backup');

class FileBackupCommand extends BackupCommand {

  constructor() {
    super();

    tmp.setGracefulCleanup();
  }

  async dumpDB(options: IBackupCommandOption):
      Promise<{ stdout: string, stderr: string, dbDumpFilePath: string }> {
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    const dbDumpFilePath = join(tmpdir.name, `${options.backupfilePrefix}-${format(Date.now(), 'yyyyMMddHHmmss')}.gz`);

    logger.info(`backup ${dbDumpFilePath}...`);
    logger.info('archive files...');
    const { stdout, stderr } = await exec(`tar -zcf ${dbDumpFilePath} ${options.backupToolOptions || ''}`);
    return { stdout, stderr, dbDumpFilePath };
  }

  /**
   * Archive files as a stream
   *
   * This method executes tar command and returns its stdout as a stream.
   * This allows streaming the archive directly to a storage service without creating temporary files.
   */
  async dumpDBAsStream(options: IBackupCommandOption): Promise<Readable> {
    logger.info('archive files as stream...');

    // Execute tar command with stdout as a pipe
    const tar = spawn(`tar -zc ${options.backupToolOptions || ''}`, { shell: false, stdio: ['ignore', 'pipe', 'pipe'] });

    // Log stderr output
    tar.stderr.on('data', (data) => {
      logger.warn(data.toString());
    });

    // Handle process errors
    tar.on('error', (error) => {
      logger.error(`tar process error: ${error.message}`);
      throw error;
    });

    // Return stdout stream
    return tar.stdout;
  }

}

const backupCommand = new FileBackupCommand();

backupCommand
  .version(version)
  .addBackupOptions()
  .addHelpText('after', `
    NOTICE:
      You can pass tar options by set "--backup-tool-options". (ex. "-v /path/to/file")
      `.replace(/^ {4}/mg, ''))
  .setBackupAction();

backupCommand.parse(process.argv); // execute backup command

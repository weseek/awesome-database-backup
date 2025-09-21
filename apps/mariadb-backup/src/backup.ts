/**
 * An executable file that stores backups for MariaDB to a storage service.
 * Execute with --help to see usage instructions.
 */
import { exec as execOriginal, spawn } from 'child_process';
import { BackupCommand, IBackupCommandOption } from '@awesome-database-backup/commands';
import { join } from 'path';
import { promisify } from 'util';
import { Readable } from 'stream';
import loggerFactory from './logger/factory';

const version = require('@awesome-database-backup/mariadb-backup/package.json').version;
const tmp = require('tmp');

const exec = promisify(execOriginal);
const logger = loggerFactory('mariadb-backup');

class MariaDBBackupCommand extends BackupCommand {

  constructor() {
    super();

    tmp.setGracefulCleanup();
  }

  getBackupFileExtension(): string {
    return '.bz2';
  }

  async dumpDB(options: IBackupCommandOption):
      Promise<{ stdout: string, stderr: string, dbDumpFilePath: string }> {
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    const dbDumpFilePath = join(tmpdir.name, this.getBackupFileName(options));

    logger.info(`backup ${dbDumpFilePath}...`);
    logger.info('dump MariaDB...');
    const { stdout, stderr } = await exec(
      `set -o pipefail; mariadb-dump ${options.backupToolOptions} | bzip2 > ${dbDumpFilePath}`,
      { shell: '/bin/bash' },
    );
    return { stdout, stderr, dbDumpFilePath };
  }

  /**
   * Dump MariaDB database as a stream
   *
   * This method executes mariadb-dump command and returns its stdout as a stream.
   * This allows streaming the backup directly to a storage service without creating temporary files.
   */
  async dumpDBAsStream(options: IBackupCommandOption): Promise<Readable> {
    logger.info('dump MariaDB as stream...');

    // Execute mariadb-dump command with stdout as a pipe
    const mariadbdump = spawn(`set -o pipefail; mariadb-dump ${options.backupToolOptions} | bzip2`, { shell: '/bin/bash', stdio: ['ignore', 'pipe', 'pipe'] });

    // Log stderr output
    mariadbdump.stderr.on('data', (data) => {
      logger.warn(data.toString());
    });

    // Handle process errors
    mariadbdump.on('error', (error) => {
      logger.error(`mariadb-dump process error: ${error.message}`);
      throw error;
    });

    // Return stdout stream
    return mariadbdump.stdout;
  }

}

const backupCommand = new MariaDBBackupCommand();

backupCommand
  .version(version)
  .addBackupOptions()
  .addHelpText('after', `
    NOTICE:
      You can pass MysSQL options by set "--backup-tool-options". (ex. "--host db.example.com --user admin")
      `.replace(/^ {4}/mg, ''))
  .setBackupAction();

backupCommand.parse(process.argv); // execute backup command

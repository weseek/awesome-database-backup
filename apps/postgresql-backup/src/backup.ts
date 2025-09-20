/**
 * An executable file that stores backups for Postgresql to a storage service.
 * Execute with --help to see usage instructions.
 */
import { format } from 'date-fns';
import { exec as execOriginal, spawn } from 'child_process';
import { BackupCommand, IBackupCommandOption } from '@awesome-database-backup/commands';
import { join } from 'path';
import { promisify } from 'util';
import { Readable } from 'stream';
import loggerFactory from './logger/factory';

const version = require('@awesome-database-backup/postgresql-backup/package.json').version;
const tmp = require('tmp');

const exec = promisify(execOriginal);
const logger = loggerFactory('postgresql-backup');

class PostgreSQLBackupCommand extends BackupCommand {

  constructor() {
    super();

    tmp.setGracefulCleanup();
  }

  getBackupFileExtension(): string {
    return 'bz2';
  }

  async dumpDB(options: IBackupCommandOption):
      Promise<{ stdout: string, stderr: string, dbDumpFilePath: string }> {
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    const dbDumpFilePath = join(tmpdir.name, this.getBackupFileName(options));

    logger.info(`backup ${dbDumpFilePath}...`);
    logger.info('dump PostgreSQL...');
    const { stdout, stderr } = await exec(
      `set -o pipefail; pg_dumpall ${options.backupToolOptions} | bzip2 > ${dbDumpFilePath}`,
      { shell: '/bin/bash' },
    );
    return { stdout, stderr, dbDumpFilePath };
  }

  /**
   * Dump PostgreSQL database as a stream
   *
   * This method executes pg_dumpall command and returns its stdout as a stream.
   * This allows streaming the backup directly to a storage service without creating temporary files.
   */
  async dumpDBAsStream(options: IBackupCommandOption): Promise<Readable> {
    logger.info('dump PostgreSQL as stream...');

    // Execute pg_dumpall command with stdout as a pipe
    const pgdumpall = spawn(`set -o pipefail; pg_dumpall ${options.backupToolOptions} | bzip2`, { shell: '/bin/bash', stdio: ['ignore', 'pipe', 'pipe'] });

    // Log stderr output
    pgdumpall.stderr.on('data', (data) => {
      logger.warn(data.toString());
    });

    // Handle process errors
    pgdumpall.on('error', (error) => {
      logger.error(`pg_dumpall process error: ${error.message}`);
      throw error;
    });

    // Return stdout stream
    return pgdumpall.stdout;
  }

}

const backupCommand = new PostgreSQLBackupCommand();

backupCommand
  .version(version)
  .addBackupOptions()
  .addHelpText('after', `
    TIPS:
      You can omit entering the DB password by setting it as an environment variable like this: \`export PGPASSWORD="password"\
      `.replace(/^ {4}/mg, ''))
  .addHelpText('after', `
    NOTICE:
      You can pass PostgreSQL options by set "--restore-tool-options". (ex. "--host db.example.com --username postgres")
      `.replace(/^ {4}/mg, ''))
  .setBackupAction();

backupCommand.parse(process.argv); // execute backup command

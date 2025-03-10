/**
 * An executable file that stores backups for MongoDB to a storage service.
 * Execute with --help to see usage instructions.
 */
import { format } from 'date-fns';
import { exec as execOriginal, spawn } from 'child_process';
import { BackupCommand, IBackupCommandOption } from '@awesome-database-backup/commands';
import { join } from 'path';
import { promisify } from 'util';
import { Readable } from 'stream';
import loggerFactory from './logger/factory';

const version = require('@awesome-database-backup/mongodb-backup/package.json').version;
const tmp = require('tmp');

const exec = promisify(execOriginal);
const logger = loggerFactory('mongodb-backup');

class MongoDBBackupCommand extends BackupCommand {

  constructor() {
    super();

    tmp.setGracefulCleanup();
  }

  async dumpDB(options: IBackupCommandOption):
      Promise<{ stdout: string, stderr: string, dbDumpFilePath: string }> {
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    const dbDumpFilePath = join(tmpdir.name, `${options.backupfilePrefix}-${format(Date.now(), 'yyyyMMddHHmmss')}.gz`);

    logger.info(`backup ${dbDumpFilePath}...`);
    logger.info('dump MongoDB...');
    const { stdout, stderr } = await exec(`mongodump --gzip --archive=${dbDumpFilePath} ${options.backupToolOptions}`);
    return { stdout, stderr, dbDumpFilePath };
  }

  /**
   * Dump MongoDB database as a stream
   *
   * This method executes mongodump command and returns its stdout as a stream.
   * This allows streaming the backup directly to a storage service without creating temporary files.
   */
  async dumpDBAsStream(options: IBackupCommandOption): Promise<Readable> {
    logger.info('dump MongoDB as stream...');

    // Execute mongodump command with stdout as a pipe
    const mongodump = spawn(`mongodump --gzip --archive ${options.backupToolOptions}`, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

    // Log stderr output
    mongodump.stderr.on('data', (data) => {
      logger.warn(data.toString());
    });

    // Handle process errors
    mongodump.on('error', (error) => {
      logger.error(`mongodump process error: ${error.message}`);
      throw error;
    });

    // Return stdout stream
    return mongodump.stdout;
  }

}

const backupCommand = new MongoDBBackupCommand();

backupCommand
  .version(version)
  .addBackupOptions()
  .addHelpText('after', `
    NOTICE:
      You can pass mongoDB options by set "--backup-tool-options". (ex. "--host db.example.com --username admin")
      `.replace(/^ {4}/mg, ''))
  .setBackupAction();

backupCommand.parse(process.argv); // execute backup command

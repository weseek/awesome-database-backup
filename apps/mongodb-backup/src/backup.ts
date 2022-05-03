/**
 * An executable file that stores backups for MongoDB to a storage service.
 * Execute with --help to see usage instructions.
 */
import { format } from 'date-fns';
import { exec } from 'child_process';
import { BackupCommand, IBackupCommandOption } from '@awesome-backup/commands';
import { join } from 'path';
import loggerFactory from './logger/factory';

const version = require('@awesome-backup/list/package.json').version;
const tmp = require('tmp');

const logger = loggerFactory('mongodb-awesome-backup');

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
    return new Promise((resolve, reject) => {
      exec(
        `mongodump --gzip --archive=${dbDumpFilePath} ${options.backupToolOptions}`,
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
          }
          resolve({ stdout, stderr, dbDumpFilePath });
        },
      );
    });
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

/**
 * An executable file that stores backups for MongoDB to a storage service.
 * Execute with --help to see usage instructions.
 */
import { exec } from 'child_process';
import { BackupCommand } from '@awesome-backup/core';
import loggerFactory from '../logger/factory';
import { PACKAGE_VERSION } from '../config/version';

const logger = loggerFactory('mongodb-awesome-backup');

class MongoDBBackupCommand extends BackupCommand {

  async dumpDB(destinationPath: string, userSpecifiedOption?: string): Promise<{ stdout: string; stderr: string; }> {
    logger.info('dump MongoDB...');
    return new Promise((resolve, reject) => {
      exec(
        `mongodump --out ${destinationPath} ${userSpecifiedOption}`,
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
          }
          resolve({ stdout, stderr });
        },
      );
    });
  }

}

const backupCommand = new MongoDBBackupCommand();

backupCommand
  .version(PACKAGE_VERSION)
  .addBackupOptions()
  .addHelpText('after', `
    NOTICE:
      You can pass mongoDB options by set "--backup-tool-options". (ex. "--host db.example.com --username admin")
      `.replace(/^ {4}/mg, ''))
  .setBackupAction();

backupCommand.parse(process.argv); // execute backup command

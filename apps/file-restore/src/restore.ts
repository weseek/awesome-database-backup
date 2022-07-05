/**
 * An executable file that restore for MariaDB from a backup in a storage service.
 * Execute with --help to see usage instructions.
 */
import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import { RestoreCommand } from '@awesome-database-backup/commands';
import loggerFactory from './logger/factory';

const version = require('@awesome-database-backup/file-restore/package.json').version;

const logger = loggerFactory('file-restore');

const exec = promisify(execOriginal);

class FileRestoreCommand extends RestoreCommand {

  async processBackupFile(backupFilePath: string): Promise<string> {
    return backupFilePath;
  }

  async restoreDB(sourcePath: string, userSpecifiedOption?: string): Promise<{ stdout: string, stderr: string }> {
    logger.info('restore archive...');
    exec(`echo "tar -zxf ${sourcePath} ${userSpecifiedOption || ''}" > /tmp/hogehoge.txt`);
    return exec(`tar -zxf ${sourcePath} ${userSpecifiedOption || ''}`);
  }

}

const restoreCommand = new FileRestoreCommand();

restoreCommand
  .version(version)
  .addRestoreOptions()
  .addHelpText('after', `
    TIPS:
      You can omit entering the DB password by setting it as an environment variable like this: \`export MYSQL_PWD="password"\
      `.replace(/^ {4}/mg, ''))
  .addHelpText('after', `
    NOTICE:
      You can pass tar options by set "--restore-tool-options". (ex. "-C /path/to/restore")
      `.replace(/^ {4}/mg, ''))
  .setRestoreAction();

restoreCommand.parse(process.argv); // execute restore command

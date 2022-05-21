/**
 * An executable file that restore for MySQL from a backup in a storage service.
 * Execute with --help to see usage instructions.
 */
import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import { RestoreCommand } from '@awesome-backup/commands';
import loggerFactory from './logger/factory';

const version = require('@awesome-backup/mysql-restore/package.json').version;

const logger = loggerFactory('mysql-restore');

const exec = promisify(execOriginal);

class MySQLSQLRestoreCommand extends RestoreCommand {

  async restoreDB(sourcePath: string, userSpecifiedOption?: string): Promise<{ stdout: string, stderr: string }> {
    logger.info('restore MySQL...');
    return exec(`cat ${sourcePath} | mysql ${userSpecifiedOption}`);
  }

}

const restoreCommand = new MySQLSQLRestoreCommand();

restoreCommand
  .version(version)
  .addRestoreOptions()
  .addHelpText('after', `
    TIPS:
      You can omit entering the DB password by setting it as an environment variable like this: \`export MYSQL_PWD="password"\
      `.replace(/^ {4}/mg, ''))
  .addHelpText('after', `
    NOTICE:
      You can pass MySQL options by set "--restore-tool-options". (ex. "--host db.example.com --user root")
      `.replace(/^ {4}/mg, ''))
  .setRestoreAction();

restoreCommand.parse(process.argv); // execute restore command

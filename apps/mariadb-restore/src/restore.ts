/**
 * An executable file that restore for MariaDB from a backup in a storage service.
 * Execute with --help to see usage instructions.
 */
import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import { RestoreCommand } from '@awesome-backup/commands';
import loggerFactory from './logger/factory';

const version = require('@awesome-backup/mariadb-restore/package.json').version;

const logger = loggerFactory('mariadb-restore');

const exec = promisify(execOriginal);

class MariaDBSQLRestoreCommand extends RestoreCommand {

  async restoreDB(sourcePath: string, userSpecifiedOption?: string): Promise<{ stdout: string, stderr: string }> {
    logger.info('restore MariaDB...');
    return exec(`cat ${sourcePath} | mysql ${userSpecifiedOption}`);
  }

}

const restoreCommand = new MariaDBSQLRestoreCommand();

restoreCommand
  .version(version)
  .addRestoreOptions()
  .addHelpText('after', `
    TIPS:
      You can omit entering the DB password by setting it as an environment variable like this: \`export MYSQL_PWD="password"\
      `.replace(/^ {4}/mg, ''))
  .addHelpText('after', `
    NOTICE:
      You can pass MariaDB options by set "--restore-tool-options". (ex. "--host db.example.com --user root")
      `.replace(/^ {4}/mg, ''))
  .setRestoreAction();

restoreCommand.parse(process.argv); // execute restore command

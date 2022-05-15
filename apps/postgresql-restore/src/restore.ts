/**
 * An executable file that restore for PostgreSQL from a backup in a storage service.
 * Execute with --help to see usage instructions.
 */
import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import { RestoreCommand } from '@awesome-backup/commands';
import loggerFactory from './logger/factory';

const version = require('@awesome-backup/postgresql-restore/package.json').version;

const logger = loggerFactory('postgresql-restore');

const exec = promisify(execOriginal);

class PostgreSQLRestoreCommand extends RestoreCommand {

  async restoreDB(sourcePath: string, userSpecifiedOption?: string): Promise<{ stdout: string, stderr: string }> {
    logger.info('restore PostgreSQL...');
    return exec(`psql --file ${sourcePath} ${userSpecifiedOption}`);
  }

}

const restoreCommand = new PostgreSQLRestoreCommand();

restoreCommand
  .version(version)
  .addRestoreOptions()
  .addHelpText('after', `
    TIPS:
      You can omit entering the DB password by setting it as an environment variable like this: \`export PGPASSWORD="password"\
      `.replace(/^ {4}/mg, ''))
  .addHelpText('after', `
    NOTICE:
      You can pass PostgreSQL options by set "--restore-tool-options". (ex. "--host db.example.com --username postgres")
      `.replace(/^ {4}/mg, ''))
  .setRestoreAction();

restoreCommand.parse(process.argv); // execute restore command

/**
 * An executable file that stores backups for Postgresql to a storage service.
 * Execute with --help to see usage instructions.
 */
import { format } from 'date-fns';
import { exec as execOriginal } from 'child_process';
import { BackupCommand, IBackupCommandOption } from '@awesome-database-backup/commands';
import { join } from 'path';
import { promisify } from 'util';
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

  async dumpDB(options: IBackupCommandOption):
      Promise<{ stdout: string, stderr: string, dbDumpFilePath: string }> {
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    const dbDumpFilePath = join(tmpdir.name, `${options.backupfilePrefix}-${format(Date.now(), 'yyyyMMddHHmmss')}.bz2`);

    logger.info(`backup ${dbDumpFilePath}...`);
    logger.info('dump PostgreSQL...');
    const { stdout, stderr } = await exec(`pg_dumpall ${options.backupToolOptions} | bzip2 > ${dbDumpFilePath}`);
    return { stdout, stderr, dbDumpFilePath };
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

#!/usr/bin/env node
/**
 * An executable file that stores backups for Postgresql to a storage service.
 * Execute with --help to see usage instructions.
 */
import { exec } from 'child_process';
import { BackupCommand } from '@awesome-backup/core';
import loggerFactory from '../services/logger';
import { PACKAGE_VERSION } from '../config/version';

const logger = loggerFactory('postgresql-awesome-backup');

async function dumpPostgreSQL(destinationPath: string, userSpecifiedOption?: string): Promise<{ stdout: string, stderr: string }> {
  logger.info('dump PostgreSQL...');
  return new Promise((resolve, reject) => {
    exec(
      `pg_dumpall --file ${destinationPath} ${userSpecifiedOption}`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        }
        resolve({ stdout, stderr });
      },
    );
  });
}

const backupCommand = new BackupCommand();

backupCommand
  .version(PACKAGE_VERSION)
  .setBackupArgument()
  .addBackupOptions()
  .addHelpText('after', `
    TIPS:
      You can omit entering the DB password by setting it as an environment variable like this: \`export PGPASSWORD="password"\
      `.replace(/^ {4}/mg, ''))
  .addHelpText('after', `
    NOTICE:
      You can pass PostgreSQL options by set "--restore-tool-options". (ex. "--host db.example.com --username postgres")
      `.replace(/^ {4}/mg, ''))
  .setBackupAction(dumpPostgreSQL);

backupCommand.parse(process.argv); // execute backup command

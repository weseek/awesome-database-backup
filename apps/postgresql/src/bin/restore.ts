#!/usr/bin/env node

import { exec } from 'child_process';

import { RestoreCommand } from '@awesome-backup/core';
import loggerFactory from '../services/logger';
import { PACKAGE_VERSION } from '../config/version';

const logger = loggerFactory('mongodb-awesome-backup');

async function restorePostgreSQL(sourcePath: string, userSpecifiedOption?: string): Promise<{ stdout: string, stderr: string }> {
  logger.info('restore PostgreSQL...');
  return new Promise((resolve, reject) => {
    exec(
      `psql --file ${sourcePath} ${userSpecifiedOption}`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        }
        resolve({ stdout, stderr });
      },
    );
  });
}

const restoreCommand = new RestoreCommand();

restoreCommand
  .version(PACKAGE_VERSION)
  .setRestoreArgument()
  .addRestoreOptions()
  .addHelpText('after', `
    TIPS:
      You can omit entering the DB password by setting it as an environment variable like this: \`export PGPASSWORD="password"\
      `.replace(/^ {4}/mg, ''))
  .addHelpText('after', `
    NOTICE:
      You can pass PostgreSQL options by set "--restore-tool-options". (ex. "--host db.example.com --username postgres")
      `.replace(/^ {4}/mg, ''))
  .setRestoreAction(restorePostgreSQL);

restoreCommand.parse(process.argv); // execute restore command

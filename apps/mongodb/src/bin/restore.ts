#!/usr/bin/env node
/**
 * An executable file that restore for MongoDB from a backup in a storage service.
 * Execute with --help to see usage instructions.
 */
import { exec } from 'child_process';
import { RestoreCommand } from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../config/version';

async function restoreMongoDB(sourcePath: string, userSpecifiedOption?: string): Promise<{ stdout: string, stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(
      `mongorestore ${sourcePath} ${userSpecifiedOption}`,
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
    NOTICE:
      You can pass mongoDB options by set "--restore-tool-options". (ex. "--host db.example.com --username admin")
      `.replace(/^ {4}/mg, ''))
  .setRestoreAction(restoreMongoDB);

restoreCommand.parse(process.argv); // execute restore command

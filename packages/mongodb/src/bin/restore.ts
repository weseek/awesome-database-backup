#!/usr/bin/env node

import {
  execute,
  RestoreCommand,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../config/version';

async function restoreMongoDB(sourcePath: string, mongorestoreRequiredOptions?: string): Promise<{ stdout: string, stderr: string }> {
  const restoreCommand = 'mongorestore';
  const mongorestoreArgs = sourcePath;
  return execute(restoreCommand, mongorestoreArgs, mongorestoreRequiredOptions);
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

restoreCommand.parse(process.argv);

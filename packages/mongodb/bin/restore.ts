#!/usr/bin/env node

import { program } from 'commander';

import {
  execute,
  addRestoreOptions, setRestoreAction,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../src/config/version';

async function restoreMongoDB(sourcePath: string, mongorestoreRequiredOptions?: string): Promise<{ stdout: string, stderr: string }> {
  const restoreCommand = 'mongorestore';
  const mongorestoreArgs = sourcePath;
  return execute(restoreCommand, mongorestoreArgs, mongorestoreRequiredOptions);
}

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket');
addRestoreOptions(program);
program
  .addHelpText('after', `
    NOTICE:
      You can pass mongoDB options by set "--restore-tool-options". (ex. "--host db.example.com --username admin")
      `.replace(/^ {4}/mg, ''));
setRestoreAction(restoreMongoDB, program);

program.parse(process.argv);

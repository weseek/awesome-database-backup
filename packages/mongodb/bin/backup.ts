#!/usr/bin/env node

import { program } from 'commander';
import {
  execute,
  addBackupOptions, setBackupAction,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../src/config/version';

async function dumpMongoDB(destinationPath: string, mongodumpRequiredOptions?: string): Promise<{ stdout: string, stderr: string }> {
  const backupCommand = 'mongodump';
  const mongodumpArgs = '';
  const outputOption = `--out ${destinationPath}`;
  const mongodumpOptions = [mongodumpRequiredOptions, outputOption].join(' ');
  console.log('dump MongoDB...');
  return execute(backupCommand, mongodumpArgs, mongodumpOptions);
}

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket');
addBackupOptions(program);
program
  .addHelpText('after', `
    NOTICE:
      You can pass mongoDB options by set "--backup-tool-options". (ex. "--host db.example.com --username admin")
      `.replace(/^ {4}/mg, ''));
setBackupAction(dumpMongoDB, program);

program.parse(process.argv);

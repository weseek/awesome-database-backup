#!/usr/bin/env node

import {
  execute,
  BackupCommand,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../config/version';

async function dumpMongoDB(destinationPath: string, mongodumpRequiredOptions?: string): Promise<{ stdout: string, stderr: string }> {
  const backupCommand = 'mongodump';
  const mongodumpArgs = '';
  const outputOption = `--out ${destinationPath}`;
  const mongodumpOptions = [mongodumpRequiredOptions, outputOption].join(' ');
  console.log('dump MongoDB...');
  return execute(backupCommand, mongodumpArgs, mongodumpOptions);
}

const backupCommand = new BackupCommand();

backupCommand
  .version(PACKAGE_VERSION)
  .setBackupArgument()
  .addBackupOptions()
  .addHelpText('after', `
    NOTICE:
      You can pass mongoDB options by set "--backup-tool-options". (ex. "--host db.example.com --username admin")
      `.replace(/^ {4}/mg, ''))
  .setBackupAction(dumpMongoDB);

backupCommand.parse(process.argv);

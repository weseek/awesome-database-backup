import {
  execute,
  BackupCommand,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../config/version';

async function dumpPostgreSQL(destinationPath: string, pgdumpRequiredOptions?: string): Promise<{ stdout: string, stderr: string }> {
  const backupCommand = 'pg_dumpall';
  const pgdumpArgs = '';
  const pgdumpOutputOption = `--file ${destinationPath}`;
  const pdgumpOptions = [pgdumpRequiredOptions, pgdumpOutputOption].join(' ');
  console.log('dump PostgreSQL...');
  return execute(backupCommand, pgdumpArgs, pdgumpOptions);
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

backupCommand.parse(process.argv);

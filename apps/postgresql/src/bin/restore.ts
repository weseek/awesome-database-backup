import {
  execute,
  RestoreCommand,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../config/version';

async function restorePostgreSQL(sourcePath: string, psqlRequiredOptions?: string): Promise<{ stdout: string, stderr: string }> {
  const restoreCommand = 'psql';
  const inputOption = `--file ${sourcePath}`;
  const psqlArgs = '';
  const psqlOptions = [psqlRequiredOptions, inputOption].join(' ');
  console.log('restore PostgreSQL...');
  return execute(restoreCommand, psqlArgs, psqlOptions);
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

restoreCommand.parse(process.argv);

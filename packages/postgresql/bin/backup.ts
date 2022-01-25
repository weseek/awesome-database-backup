#!/usr/bin/env node

import {
  BinCommon,
  execute,
  AbstractBackupCLI, IBackupCLIOption,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../src/config/version';

class PostgreSQLBackupCLI extends AbstractBackupCLI {

  async backup(destinationPath: string, pgdumpRequiredOptions?: string): Promise<Record<string, string>> {
    const backupCommand = 'pg_dumpall';
    const pgdumpArgs = '';
    const pgdumpOutputOption = `--file ${destinationPath}`;
    const pdgumpOptions = [pgdumpRequiredOptions, pgdumpOutputOption].join(' ');
    console.log('dump PostgreSQL...');
    return execute(backupCommand, pgdumpArgs, pdgumpOptions);
  }

}

const program = new BinCommon();

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  .storageClientOptions()
  .storageClientGenerateHook()
  .option('--backupfile-prefix <BACKUPFILE_PREFIX>', 'Prefix of backup file.', 'backup')
  .option('--cronmode', 'Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically.', false)
  .option('--cron-expression <CRON_EXPRESSION>', 'Cron expression (ex. CRON_EXPRESSION="0 4 * * *" if you want to run at 4:00 every day)')
  .option('--healthchecks-url <URL>', 'URL that gets called after a successful backup (eg. https://healthchecks.io)')
  .option('--backup-tool-options <OPTIONS_STRING>', 'pass options to pg_dumpall exec (ex. "--host db.example.com --username postgres")')
  .addHelpText('after', `
    TIPS:
      You can omit entering the DB password by setting it as an environment variable like this: \`export PGPASSWORD="password"\
      `.replace(/^ {4}/mg, ''))
  .addHelpText('after', `
    NOTICE:
      You can pass PostgreSQL options  to the tool used internally.
      These options may not available depending on the version of the tool.
      `.replace(/^ {4}/mg, ''))
  .action(async(targetBucketUrlString, options: IBackupCLIOption) => {
    try {
      if (options.cronmode && options.cronExpression == null) {
        console.error('The option "--cron-expression" must be specified in cron mode.');
        return;
      }
      if (program.storageClient == null) throw new Error('URL scheme is not that of a supported provider.');

      const targetBucketUrl = new URL(targetBucketUrlString);
      const cli = new PostgreSQLBackupCLI(program.storageClient);
      if (options.cronmode) {
        await cli.mainCronMode(targetBucketUrl, options);
      }
      else {
        await cli.main(targetBucketUrl, options);
      }
    }
    catch (e: any) {
      console.error(e);
    }
  });

program.parse(process.argv);

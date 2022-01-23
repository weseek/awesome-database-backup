#!/usr/bin/env node

import {
  BinCommon,
  execute,
  AbstractBackupCLI, IBackupCLIOption,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../src/config/version';

class MongoDBBackupCLI extends AbstractBackupCLI {

  async backup(destinationPath: string, mongodumpRequiredOptions?: string): Promise<Record<string, string>> {
    const backupCommand = 'mongodump';
    const mongodumpArgs = '';
    const outputOption = `--out ${destinationPath}`;
    const mongodumpOptions = [mongodumpRequiredOptions, outputOption].join(' ');
    console.log('dump MongoDB...');
    return execute(backupCommand, mongodumpArgs, mongodumpOptions);
  }

}

const program = new BinCommon();

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  .providerOptions()
  .providerGenerateHook()
  .option('--backupfile-prefix <BACKUPFILE_PREFIX>', 'Prefix of backup file.', 'backup')
  .option('--cronmode', 'Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically.', false)
  .option('--cron-expression <CRON_EXPRESSION>', 'Cron expression (ex. CRON_EXPRESSION="0 4 * * *" if you want to run at 4:00 every day)')
  .option('--healthcheck-url <HEALTHCHECK_URL>', 'URL that gets called after a successful backup (eg. https://healthchecks.io)')
  .option('--backup-tool-options <OPTIONS_STRING>', 'pass options to mongodump exec (ex. "--host db.example.com --username admin")')
  .addHelpText('after', `
    NOTICE:
      You can pass mongoDB options to the tool used internally.
      These options may not available depending on the version of the tool.
      `.replace(/^ {4}/mg, ''))
  .action(async(targetBucketUrlString, options: IBackupCLIOption) => {
    try {
      if (options.cronmode && options.cronExpression == null) {
        console.error('The option "--cron-expression" must be specified in cron mode.');
        return;
      }
      if (program.provider == null) throw new Error('URL scheme is not that of a supported provider.');

      const targetBucketUrl = new URL(targetBucketUrlString);
      const cli = new MongoDBBackupCLI(program.provider);
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

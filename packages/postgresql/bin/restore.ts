#!/usr/bin/env node

import { program } from 'commander';
import { basename, join, dirname } from 'path';
import { format } from 'date-fns';
import {
  generateProvider,
  configExistS3, createConfigS3, unlinkConfigS3,
  expand,
} from '@awesome-backup/core';
import { restore, convertOption } from '@awesome-backup/postgresql';
import { PACKAGE_VERSION } from '@awesome-backup/postgresql/config/version';
import { promisify } from 'util';

const exec = promisify(require('child_process').exec);

const tmp = require('tmp');
const schedule = require('node-schedule');

async function main(targetBucketUrl: string, options: Record<string, string>) {
  tmp.dir({ unsafeCleanup: true }, async(error: any, path: string, cleanUpCallback: any) => {
    try {
      console.log(`=== ${basename(__filename)} started at ${format(new Date(), 'yyyy/MM/dd HH:mm:ss')} ===`);
      const target = join(path, basename(targetBucketUrl));

      const noConfiguration = configExistS3();
      if (noConfiguration) {
        if (options.awsRegion == null || options.awsAccessKeyId == null || options.awsSecretAccessKey == null) {
          console.error('If the configuration file does not exist, '
                        + 'you will need to set "--aws-region", "--aws-access-key-id", and "--aws-secret-access-key".');
          return;
        }
      }
      /* If the configuration file does not exist, create it temporarily from the options,
        and delete it when it is no longer needed. */
      if (noConfiguration) {
        createConfigS3(options);
      }

      const provider = generateProvider(targetBucketUrl);
      await provider.copyFile(targetBucketUrl, target);
      let ret = await exec(`ls -al ${target}`);
      console.log(ret.stdout);
      console.log(`expands ${target}...`);
      const { expandedPath } = await expand(target);
      ret = await exec(`ls -al ${dirname(expandedPath)}`);
      console.log(ret.stdout);
      const pgtoolOption = convertOption(options);
      console.log(pgtoolOption);
      console.log('restore PostgreSQL...');
      await restore(expandedPath, pgtoolOption);

      if (noConfiguration) {
        unlinkConfigS3();
      }
    }
    catch (e: any) {
      console.error(e);
    }
    finally {
      cleanUpCallback();
    }
  });
}

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  /* Required fields that are intentionally treat as optional so that they can be specified by environment variables. */
  .option('--aws-region <AWS_REGION>', 'AWS Region')
  .option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID', process.env.AWS_ACCESS_KEY_ID)
  .option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key', process.env.AWS_SECRET_ACCESS_KEY)
  /*
   * PostgreSQL options are "--postgresql-XXX", which corresponds to the "--XXX" option of the tool used internally.
   * !!! These options may not available depending on the version of the tool used internally. !!!
   */
  /* Connection options */
  .option('--postgresql-host <POSTGRESQL_HOST>', 'database server host or socket directory')
  .option('--postgresql-port <POSTGRESQL_PORT>', 'database server port number')
  .option('--postgresql-username <POSTGRESQL_USERNAME>', 'connect as specified database user')
  .option('--postgresql-no-password', 'never prompt for password')
  .option('--postgresql-password', 'force password prompt (should happen automatically)')
  .addHelpText('after', `
    TIPS:
      You can omit entering the DB password by setting it as an environment variable like this: \`export PGPASSWORD="password"\
      `.replace(/^ {4}/mg, ''))
  .addHelpText('after', `
    NOTICE:
      PostgreSQL options are "--postgresql-XXX", which corresponds to the "--XXX" option of the tool used internally.
      These options may not available depending on the version of the tool.
      `.replace(/^ {4}/mg, ''))
  .action(async(targetBucketUrl, options) => {
    if (options.cronmode) {
      if (options.cronExpression == null) {
        console.error('The option "--cron-expression" must be specified in cron mode.');
        return;
      }
      console.log(`=== started in cron mode ${format(new Date(), 'yyyy/MM/dd HH:mm:ss')} ===`);
      schedule.scheduleJob(options.cronExpression, async() => {
        await main(targetBucketUrl, options);
      });
    }
    else {
      await main(targetBucketUrl, options);
    }
  });

program.parse(process.argv);

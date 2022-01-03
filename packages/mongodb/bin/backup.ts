#!/usr/bin/env node

import { program } from 'commander';
import { basename, join } from 'path';
import { format } from 'date-fns';
import {
  generateProvider,
  configExistS3, createConfigS3, unlinkConfigS3,
  compress,
} from '@awesome-backup/core';
import { backup } from '@awesome-backup/mongodb';
import { PACKAGE_VERSION } from '@awesome-backup/postgresql/config/version';

const tmp = require('tmp');
const schedule = require('node-schedule');

async function main(targetBucketUrl: string, options: Record<string, string>) {
  tmp.dir({ unsafeCleanup: true }, async(error: any, path: string, cleanUpCallback: any) => {
    try {
      console.log(`=== ${basename(__filename)} started at ${Date().toLocaleString()} ===`);
      const target = join(path, `${options.backupfilePrefix}-${format(new Date(), 'yyyyMMddHHmmss')}`);

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
      console.log('dump MongoDB...');
      await backup(target);
      console.log(`backup ${target}...`);
      const { compressedFilePath } = await compress(target);
      await provider.copyFile(compressedFilePath, targetBucketUrl);

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
  // Required fields that are intentionally treat as optional so that they can be specified by environment variables.
  .option('--aws-region <AWS_REGION>', 'AWS Region')
  .option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID', process.env.AWS_ACCESS_KEY_ID)
  .option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key', process.env.AWS_SECRET_ACCESS_KEY)
  .option('--backupfile-prefix <BACKUPFILE_PREFIX>', 'Prefix of backup file.', 'backup')
  .option('--mongodb-host', 'Specifies the resolvable hostname of the MongoDB deployment.'
          + 'By default, `backup` attempts to connect to a MongoDB instance'
          + 'running on the "mongo" on port number 27017.', 'mongo')
  .option('--cronmode', 'Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically.', false)
  .option('--cron-expression <CRON_EXPRESSION>', 'Cron expression (ex. CRON_EXPRESSION="0 4 * * *" if you want to run at 4:00 every day)')
  // [TODO] implement below option
  // .option('--healthcheck-url <HEALTHCHECK_URL>', 'URL that gets called after a successful backup (eg. https://healthchecks.io)')
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

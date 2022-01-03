#!/usr/bin/env node

/**
 * Usage: backup [options] <TARGET_BUCKET_URL>
 *
 * Arguments:
 *   TARGET_BUCKET_URL                                URL of target bucket
 *
 * Options:
 *   -V, --version                                    output the version number
 *   --aws-access-key-id <AWS_ACCESS_KEY_ID>          Your IAM Access Key ID
 *   --aws-secret-access-key <AWS_SECRET_ACCESS_KEY>  Your IAM Secret Access Key
 *   --backup-file-prefix                             Prefix of backup file. (default: "backup")
 *   --mongodb-host                                   Specifies the resolvable hostname of the MongoDB deployment.
 *                                                    By default, `backup` attempts to connect to a MongoDB instance
 *                                                    running on the "mongo" on port number 27017. (default: "mongo")
 *   --cronmode                                       Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically. (default: false)
 *   -h, --help                                       display help for command
 */

import { program } from 'commander';
import { basename, join } from 'path';
import {
  generateProvider,
  configExistS3, createConfigS3, unlinkConfigS3,
} from '@awesome-backup/core';
import { backup, compress } from '@awesome-backup/mongodb';

const packageJson = require(join(__dirname, '..', 'package.json'));
const version = packageJson.version;

program
  .version(version)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  // Required fields that are intentionally treat as optional so that they can be specified by environment variables.
  .option('--aws-region <AWS_REGION>', 'AWS Region')
  .option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID', process.env.AWS_ACCESS_KEY_ID)
  .option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key', process.env.AWS_SECRET_ACCESS_KEY)
  .option('--backupfile-prefix', 'Prefix of backup file.', 'backup')
  .option('--mongodb-host', 'Specifies the resolvable hostname of the MongoDB deployment.'
          + 'By default, `backup` attempts to connect to a MongoDB instance'
          + 'running on the "mongo" on port number 27017.', 'mongo')
  .option('--cronmode', 'Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically.', false)
  .option('--healthcheck-url <HEALTHCHECK_URL>', 'URL that gets called after a successful backup (eg. https://healthchecks.io)')
  .action(async(targetBucketUrl, options) => {
    console.log(`=== ${basename(__filename)} started at ${Date().toLocaleString()} ===`);

    const noConfiguration = configExistS3();
    if (noConfiguration) {
      if (options.awsRegion == null || options.awsAccessKeyId == null || options.awsSecretAccessKey == null) {
        console.error('If the configuration file does not exist, you will need to set "--aws-region", "--aws-access-key-id", and "--aws-secret-access-key".');
        return;
      }
    }

    /* If the configuration file does not exist, create it temporarily from the options,
       and delete it when it is no longer needed. */
    if (noConfiguration) {
      createConfigS3(options);
    }
    const provider = generateProvider(targetBucketUrl);

    const target = '/tmp/backup_20220103/mongo';

    console.log('dump MongoDB...');
    backup(target);

    console.log(`backup ${target}...`);
    const { compressedFilePath } = await compress(target);
    provider
      .copyFile(compressedFilePath, targetBucketUrl)
      .then(() => {
        console.log('succeeded');
      })
      .catch((e: any) => {
        console.log(e);
      })
      .finally(() => {
        if (noConfiguration) {
          unlinkConfigS3();
        }
      });
  });

program.parse(process.argv);

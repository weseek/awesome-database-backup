#!/usr/bin/env node

import { program } from 'commander';
import {
  configExistS3, createConfigS3,
  PruneCLI, IPruneCLIOption,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '@awesome-backup/postgresql/config/version';

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  /* Required fields that are intentionally treat as optional so that they can be specified by environment variables. */
  .option('--aws-region <AWS_REGION>', 'AWS Region')
  .option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID', process.env.AWS_ACCESS_KEY_ID)
  .option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key', process.env.AWS_SECRET_ACCESS_KEY)
  .option('--backupfile-prefix <BACKUPFILE_PREFIX>', 'Prefix of backup file.', 'backup')
  .option('--delete-divide <DELETE_DIVIDE>', 'delete divide', parseInt, 3)
  .option('--delete-target-days-left <DELETE_TARGET_DAYS_LEFT>', 'How many days ago to be deleted', parseInt, 4)
  .action(async(targetBucketUrlString, options: IPruneCLIOption) => {
    if (!configExistS3()) {
      if (options.awsRegion == null || options.awsAccessKeyId == null || options.awsSecretAccessKey == null) {
        console.error('If the configuration file does not exist, '
                      + 'you will need to set "--aws-region", "--aws-access-key-id", and "--aws-secret-access-key".');
        return;
      }

      /* If the configuration file does not exist, it is created temporarily from the options,
        and it will be deleted when process exit. */
      const { awsRegion, awsAccessKeyId, awsSecretAccessKey } = options;
      createConfigS3({ awsRegion, awsAccessKeyId, awsSecretAccessKey });
    }

    const targetBucketUrl = new URL(targetBucketUrlString);
    try {
      await new PruneCLI().main(targetBucketUrl, options);
    }
    catch (e: any) {
      console.error(e);
    }
  });

program.parse(process.argv);

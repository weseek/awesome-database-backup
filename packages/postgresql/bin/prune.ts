#!/usr/bin/env node

import { program } from 'commander';
import { format, subDays } from 'date-fns';
import {
  generateProvider,
  configExistS3, createConfigS3, unlinkConfigS3,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '@awesome-backup/postgresql/config/version';

/* Prune command option types */
declare interface PruneOptions {
  awsRegion: string
  awsAccessKeyId: string,
  awsSecretAccessKey: string,
  backupfilePrefix: string,
  deleteDivide: number,
  deleteTargetDaysLeft: number,
}

async function prune(targetBucketUrl: URL, options: PruneOptions) {
  const secondsPerDay = 60 * 60 * 24;
  const targetBackupDay = subDays(Date.now(), options.deleteTargetDaysLeft);
  const isDeleteBackupDay = (Math.trunc(targetBackupDay.getTime() / 1000 / secondsPerDay) % options.deleteDivide === 0);
  if (isDeleteBackupDay) {
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
    const { awsRegion, awsAccessKeyId, awsSecretAccessKey } = options;
    if (noConfiguration) {
      createConfigS3({ awsRegion, awsAccessKeyId, awsSecretAccessKey });
    }

    const provider = generateProvider(targetBucketUrl.toString());
    const targetBackupUrlPrefix = new URL(`${options.backupfilePrefix}-${format(targetBackupDay, 'yyyyMMdd')}`, targetBucketUrl).toString();
    const targetBackupFiles = await provider.listFiles(targetBackupUrlPrefix, { exactMatch: false, absolutePath: false });
    for (const targetBackup of targetBackupFiles) {
      const targetBackupUrl = new URL(targetBackup, targetBucketUrl);
      provider.deleteFile(targetBackupUrl.toString());
      console.log(`DELETED past backuped file on ${provider.name}: ${targetBackupUrl}`);
    }

    if (noConfiguration) {
      unlinkConfigS3();
    }
  }
}

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
  .action(async(targetBucketUrlString, options: PruneOptions) => {
    const targetBucketUrl = new URL(targetBucketUrlString);
    try {
      await prune(targetBucketUrl, options);
    }
    catch (e: any) {
      console.error(e);
    }
  });

program.parse(process.argv);

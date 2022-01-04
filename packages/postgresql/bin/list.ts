#!/usr/bin/env node

import { EOL } from 'os';
import { program } from 'commander';
import {
  generateProvider,
  configExistS3, createConfigS3, unlinkConfigS3,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '@awesome-backup/postgresql/config/version';

const tmp = require('tmp');

async function main(targetBucketUrl: string, options: Record<string, string>) {
  tmp.dir({ unsafeCleanup: true }, async(error: any, path: string, cleanUpCallback: any) => {
    try {
      console.log(`There are files below in bucket:`);

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
      const files = await provider.listFiles(targetBucketUrl);
      console.log(files.join(EOL));

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
  .action(async(targetBucketUrl, options) => {
    await main(targetBucketUrl, options);
  });

program.parse(process.argv);

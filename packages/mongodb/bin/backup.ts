#!/usr/bin/env node

/**
 * USAGE:
 *   node bin/backup   # backup
 */

import { generateProvider } from '../../core/src';
import { readFileSync } from 'fs';
import { program, Option } from 'commander';

const version = JSON.parse(readFileSync('../package.json').toString()).version;

program
  .version(version)
  .option('--backup-file-prefix', 'Prefix of backup file.', 'backup')
  .option('--mongodb-host', 'Specifies the resolvable hostname of the MongoDB deployment. By default, `backup` attempts to connect to a MongoDB instance running on the "mongo" on port number 27017.', 'mongo')
  .option('--cronmode', 'Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically.', false)
  .addOption(new Option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID').env('AWS_ACCESS_KEY_ID'))
  .addOption(new Option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key').env('AWS_SECRET_ACCESS_KEY'))
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')

program
  .parse(process.argv)
  .action((targetBucketUrl) => {
    try {
      generateProvider(targetBucketUrl);
    } catch(e) {
      throw new Error(`Cannot generate factory: ${e}`);
    }
  })

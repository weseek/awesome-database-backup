#!/usr/bin/env node

import {
  BinCommon,
  PruneCLI, IPruneCLIOption,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../src/config/version';

const program = new BinCommon();

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  .providerOptions()
  .providerGenerateHook()
  .option('--backupfile-prefix <BACKUPFILE_PREFIX>', 'Prefix of backup file.', 'backup')
  .option('--delete-divide <DELETE_DIVIDE>', 'delete divide', parseInt, 3)
  .option('--delete-target-days-left <DELETE_TARGET_DAYS_LEFT>', 'How many days ago to be deleted', parseInt, 4)
  .action(async(targetBucketUrlString, options: IPruneCLIOption) => {
    try {
      if (program.provider == null) throw new Error('URL scheme is not that of a supported provider.');

      const targetBucketUrl = new URL(targetBucketUrlString);
      const cli = new PruneCLI(program.provider);

      await cli.main(targetBucketUrl, options);
    }
    catch (e: any) {
      console.error(e);
    }
  });

program.parse(process.argv);

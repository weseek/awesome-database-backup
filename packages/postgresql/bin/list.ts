#!/usr/bin/env node

import {
  BinCommon, ICommonCLIOption,
  ListCLI,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../src/config/version';

const program = new BinCommon();

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  /* Required fields that are intentionally treat as optional so that they can be specified by environment variables. */
  .action(async(targetBucketUrlString: string, options: ICommonCLIOption) => {
    try {
      if (program.provider == null) throw new Error('URL scheme is not that of a supported provider.');

      const targetBucketUrl = new URL(targetBucketUrlString);
      const cli = new ListCLI(program.provider);
      await cli.main(targetBucketUrl);
    }
    catch (e: any) {
      console.error(e);
    }
  });

program.parse(process.argv);

#!/usr/bin/env node

import { program } from 'commander';

import {
  addPruneOptions, setPruneAction,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../src/config/version';

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket');
addPruneOptions(program);
setPruneAction(program);

program.parse(process.argv);

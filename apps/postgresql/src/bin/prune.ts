#!/usr/bin/env node

import { PruneCommand } from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../config/version';

const pruneCommand = new PruneCommand();

pruneCommand
  .version(PACKAGE_VERSION)
  .setPruneArgument()
  .addPruneOptions()
  .setPruneAction();

pruneCommand.parse(process.argv); // execute prune command

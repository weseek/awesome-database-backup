#!/usr/bin/env node

import {
  ListCommand,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../src/config/version';

const listCommand = new ListCommand();

listCommand
  .version(PACKAGE_VERSION)
  .setListArgument()
  .addListOptions()
  .setListAction();

listCommand.parse(process.argv);

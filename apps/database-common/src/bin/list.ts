/**
 * An executable file that list files in a storage service.
 * Execute with --help to see usage instructions.
 */
import { ListCommand } from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../config/version';

const listCommand = new ListCommand();

listCommand
  .version(PACKAGE_VERSION)
  .setListArgument()
  .addListOptions()
  .setListAction();

listCommand.parse(process.argv); // execute list command

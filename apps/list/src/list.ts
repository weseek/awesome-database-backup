/**
 * An executable file that list files in a storage service.
 * Execute with --help to see usage instructions.
 */
import { ListCommand } from '@awesome-database-backup/commands';

const version = require('@awesome-database-backup/list/package.json').version;

const listCommand = new ListCommand();

listCommand
  .version(version)
  .addListOptions()
  .setListAction();

listCommand.parse(process.argv); // execute list command

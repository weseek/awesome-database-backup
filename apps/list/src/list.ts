/**
 * An executable file that list files in a storage service.
 * Execute with --help to see usage instructions.
 */
import { ListCommand, getPackageVersion } from '@awesome-database-backup/commands';

const version = getPackageVersion(__dirname);

const listCommand = new ListCommand();

listCommand
  .version(version)
  .addListOptions()
  .setListAction();

listCommand.parse(process.argv); // execute list command

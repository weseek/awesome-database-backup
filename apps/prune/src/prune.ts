/**
 * An executable file that prune backuped files in a storage service.
 * Execute with --help to see usage instructions.
 */
import { PruneCommand } from '@awesome-database-backup/commands';

const version = require('@awesome-database-backup/prune/package.json').version;

const pruneCommand = new PruneCommand();

pruneCommand
  .version(version)
  .addPruneOptions()
  .setPruneAction();

pruneCommand.parse(process.argv); // execute prune command

/**
 * An executable file that restore for MongoDB from a backup in a storage service.
 * Execute with --help to see usage instructions.
 */
import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import { RestoreCommand } from '@awesome-database-backup/commands';
import loggerFactory from './logger/factory';

const version = require('@awesome-database-backup/mongodb-restore/package.json').version;

const logger = loggerFactory('mongodb-restore');

const exec = promisify(execOriginal);

class MongoDBRestoreCommand extends RestoreCommand {

  async restoreDB(sourcePath: string, userSpecifiedOption?: string): Promise<{ stdout: string; stderr: string; }> {
    logger.info('restore MongoDB...');
    // When --archive is specified, inject the temp file path as --archive=<path>
    // because mongorestore treats the positional arg as a directory, conflicting with archive format
    if (userSpecifiedOption != null && /--archive(?:=[^\s]*)?(?!\w)/.test(userSpecifiedOption)) {
      const optionsWithPath = userSpecifiedOption.replace(/--archive(?:=[^\s]*)?(?!\w)/, `--archive=${sourcePath}`);
      return exec(`mongorestore ${optionsWithPath}`);
    }
    return exec(`mongorestore ${sourcePath} ${userSpecifiedOption}`);
  }

}

const restoreCommand = new MongoDBRestoreCommand();

restoreCommand
  .version(version)
  .addRestoreOptions()
  .addHelpText('after', `
    NOTICE:
      You can pass mongoDB options by set "--restore-tool-options". (ex. "--host db.example.com --username admin")
      `.replace(/^ {4}/mg, ''))
  .setRestoreAction();

restoreCommand.parse(process.argv); // execute restore command

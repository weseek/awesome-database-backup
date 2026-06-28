/**
 * An executable file that restore for MongoDB from a backup in a storage service.
 * Execute with --help to see usage instructions.
 */
import { exec as execOriginal } from 'node:child_process';
import { promisify } from 'node:util';
import { Option, RestoreCommand, getPackageVersion } from '@awesome-database-backup/commands';
import loggerFactory from './logger/factory';

const version = getPackageVersion(__dirname);

const logger = loggerFactory('mongodb-restore');

const exec = promisify(execOriginal);

class MongoDBRestoreCommand extends RestoreCommand {

  async restoreDB(sourcePath: string, userSpecifiedOption?: string): Promise<{ stdout: string; stderr: string; }> {
    logger.info('restore MongoDB...');
    // When --mongodb-archive is specified, pass the file path via --archive=<path>
    // because mongorestore treats the positional arg as a directory, which conflicts with archive format
    if (this.opts().mongodbArchiveFormat) {
      return exec(`mongorestore --archive=${sourcePath} ${userSpecifiedOption ?? ''}`);
    }
    return exec(`mongorestore ${sourcePath} ${userSpecifiedOption}`);
  }

}

const restoreCommand = new MongoDBRestoreCommand();

restoreCommand
  .version(version)
  .addRestoreOptions()
  .addOption(
    new Option('--mongodb-archive-format', 'restore from a MongoDB archive format backup file')
      .env('MONGODB_ARCHIVE_FORMAT'),
  )
  .addHelpText('after', `
    NOTICE:
      You can pass mongoDB options by set "--restore-tool-options". (ex. "--host db.example.com --username admin")
      `.replace(/^ {4}/mg, ''))
  .setRestoreAction();

restoreCommand.parse(process.argv); // execute restore command

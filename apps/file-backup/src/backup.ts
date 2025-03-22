/**
 * An executable file that stores files to a storage service.
 * Execute with --help to see usage instructions.
 */
import { format } from 'date-fns';
import { BackupCommand, IBackupCommandOption } from '@awesome-database-backup/commands';
import { join } from 'path';
import { Readable } from 'stream';
import * as tar from 'tar';
import loggerFactory from './logger/factory';

const version = require('@awesome-database-backup/file-backup/package.json').version;
const tmp = require('tmp');

const logger = loggerFactory('file-backup');

class FileBackupCommand extends BackupCommand {

  constructor() {
    super();

    tmp.setGracefulCleanup();
  }

  /**
   * Parse tar options from command line string
   *
   * @param optionsString Command line options string
   * @returns Parsed options object for tar package
   */
  private parseTarOptions(optionsString: string): { options: any, files: string[] } {
    const options: any = {
      gzip: true,
      // Default options
    };
    const files: string[] = [];

    if (!optionsString) {
      return { options, files };
    }

    // Split options string into arguments
    const args = optionsString.split(' ').filter(arg => arg.trim() !== '');

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '-v' || arg === '--verbose') {
        options.verbose = true;
      }
      else if (arg === '-C' && i + 1 < args.length) {
        // Change directory
        options.cwd = args[++i];
      }
      else if (!arg.startsWith('-')) {
        // Assume it's a file or directory path
        files.push(arg);
      }
      // Add more option parsing as needed
    }

    return { options, files };
  }

  async dumpDB(options: IBackupCommandOption):
      Promise<{ stdout: string, stderr: string, dbDumpFilePath: string }> {
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    const dbDumpFilePath = join(tmpdir.name, `${options.backupfilePrefix}-${format(Date.now(), 'yyyyMMddHHmmss')}.gz`);

    logger.info(`backup ${dbDumpFilePath}...`);
    logger.info('archive files...');

    let stdout = '';
    let stderr = '';

    try {
      // Parse tar options
      const { options: tarOptions, files } = this.parseTarOptions(options.backupToolOptions || '');

      // Create archive with memory usage control
      // highWaterMark: Controls the internal buffer size to reduce memory usage
      // noResume: true: Enables proper backpressure handling - pauses when destination can't keep up
      await tar.create(
        {
          ...tarOptions,
          highWaterMark: 1024 * 1024, // 1MB buffer size
          noResume: true, // Enable backpressure handling
          file: dbDumpFilePath,
        },
        files,
      );

      if (tarOptions.verbose) {
        stdout = `Created archive: ${dbDumpFilePath}`;
      }
    }
    catch (error: any) {
      stderr = error.message;
      logger.error(`Error creating archive: ${error.message}`);
    }

    return { stdout, stderr, dbDumpFilePath };
  }

  /**
   * Archive files as a stream
   *
   * This method uses tar package to create a stream.
   * This allows streaming the archive directly to a storage service without creating temporary files.
   */
  async dumpDBAsStream(options: IBackupCommandOption): Promise<Readable> {
    logger.info('archive files as stream...');

    try {
      // Parse tar options
      const { options: tarOptions, files } = this.parseTarOptions(options.backupToolOptions || '');

      // Create tar stream with memory usage control
      // highWaterMark: Controls the internal buffer size to reduce memory usage
      // noResume: true: Enables proper backpressure handling - pauses when destination can't keep up
      const stream = tar.create(
        {
          ...tarOptions,
          highWaterMark: 1024 * 1024, // 1MB buffer size
          noResume: true, // Enable backpressure handling
          // Don't specify 'file' option to get a stream
        },
        files,
      ) as unknown as Readable;

      // Handle stream errors
      stream.on('error', (error: any) => {
        logger.error(`tar process error: ${error.message}`);
        throw error;
      });

      return stream;
    }
    catch (error: any) {
      logger.error(`Error creating archive stream: ${error.message}`);
      throw error;
    }
  }

}

const backupCommand = new FileBackupCommand();

backupCommand
  .version(version)
  .addBackupOptions()
  .addHelpText('after', `
    NOTICE:
      You can pass tar options by set "--backup-tool-options". (ex. "-v /path/to/file")
      `.replace(/^ {4}/mg, ''))
  .setBackupAction();

backupCommand.parse(process.argv); // execute backup command

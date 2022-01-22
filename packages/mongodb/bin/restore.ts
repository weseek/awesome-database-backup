#!/usr/bin/env node

import {
  BinCommon,
  execute,
  AbstractRestoreCLI,
  IRestoreCLIOption,
  convertOptionAsCamelCase,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../src/config/version';

class MongoDBRestoreCLI extends AbstractRestoreCLI {

  convertOption(option: IRestoreCLIOption): Record<string, string|number|boolean|string[]|number[]> {
    const optionPrefix = 'mongodb';
    return convertOptionAsCamelCase(Object(option), optionPrefix);
  }

  async restore(sourcePath: string, mongorestoreRequiredOptions?: string) {
    const restoreCommand = 'mongorestore';
    const mongorestoreArgs = sourcePath;
    const mongorestoreOptions = [mongorestoreRequiredOptions].join(' ');
    return execute(restoreCommand, mongorestoreArgs, mongorestoreOptions);
  }

}

const program = new BinCommon();

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  .providerOptions()
  .providerGenerateHook()
  .option('--restore-tool-options <OPTIONS_STRING>', 'pass options to mongorestore exec (ex. "--host db.example.com --username admin")')
  .addHelpText('after', `
    NOTICE:
      You can pass mongoDB options to the tool used internally.
      These options may not available depending on the version of the tool.
      `.replace(/^ {4}/mg, ''))
  .action(async(targetBucketUrlString, options: IRestoreCLIOption) => {
    try {
      if (program.provider == null) throw new Error('URL scheme is not that of a supported provider.');

      const targetBucketUrl = new URL(targetBucketUrlString);
      const cli = new MongoDBRestoreCLI(program.provider);
      await cli.main(targetBucketUrl, options);
    }
    catch (e: any) {
      console.error(e);
    }
  });

program.parse(process.argv);

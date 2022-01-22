#!/usr/bin/env node

import {
  BinCommon,
  execute,
  AbstractRestoreCLI,
  IRestoreCLIOption,
  convertOptionAsCamelCase,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '@awesome-backup/postgresql/config/version';

/* Restore command option types */
declare interface IPostgreSQLRestoreOption extends IRestoreCLIOption {
  postgresqlHost: string,
  postgresqlPort: number,
  postgresqlUsername: string,
  postgresqlNoPassword: boolean,
  postgresqlPassword: boolean,
}

class PostgreSQLRestoreCLI extends AbstractRestoreCLI {

  convertOption(option: IRestoreCLIOption): Record<string, string|number|boolean|string[]|number[]> {
    const optionPrefix = 'postgresql';
    return convertOptionAsCamelCase(Object(option), optionPrefix);
  }

  async restore(sourcePath: string, psqlRequiredOptions?: string) {
    const restoreCommand = 'psql';
    const inputOption = `--file ${sourcePath}`;
    const psqlArgs = '';
    const psqlOptions = [psqlRequiredOptions, inputOption].join(' ');
    console.log('restore PostgreSQL...');
    return execute(restoreCommand, psqlArgs, psqlOptions);
  }

}

const program = new BinCommon();

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  .providerOptions()
  .providerGenerateHook()
  .option('--restore-tool-options <OPTIONS_STRING>', 'pass options to psql exec (ex. "--host db.example.com --username postgres")')
  .addHelpText('after', `
    TIPS:
      You can omit entering the DB password by setting it as an environment variable like this: \`export PGPASSWORD="password"\
      `.replace(/^ {4}/mg, ''))
  .addHelpText('after', `
    NOTICE:
      You can pass PostgreSQL options  to the tool used internally.
      These options may not available depending on the version of the tool.
      `.replace(/^ {4}/mg, ''))
  .action(async(targetBucketUrlString, options: IPostgreSQLRestoreOption) => {
    try {
      if (program.provider == null) throw new Error('URL scheme is not that of a supported provider.');

      const targetBucketUrl = new URL(targetBucketUrlString);
      const cli = new PostgreSQLRestoreCLI(program.provider);
      await cli.main(targetBucketUrl, options);
    }
    catch (e: any) {
      console.error(e);
    }
  });

program.parse(process.argv);

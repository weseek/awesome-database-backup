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

  async restore(sourcePath: string, psqlRequiredOptions?: Record<string, string|number|boolean|string[]|number[]>) {
    const restoreCommand = 'psql';
    const psqlDefaultOptions: Record<string, string> = {
    };
    const inputOption: Record<string, string> = {
      '--file': sourcePath,
    };
    const psqlArgs = '';
    console.log('restore PostgreSQL...');
    return execute(restoreCommand, [psqlArgs], { ...(psqlRequiredOptions || {}), ...inputOption }, psqlDefaultOptions);
  }

}

const program = new BinCommon();

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  .providerOptions()
  .providerGenerateHook()
  /*
   * PostgreSQL options are "--postgresql-XXX", which corresponds to the "--XXX" option of the tool used internally.
   * !!! These options may not available depending on the version of the tool used internally. !!!
   */
  /* Connection options */
  .option('--postgresql-host <POSTGRESQL_HOST>', 'database server host or socket directory')
  .option('--postgresql-port <POSTGRESQL_PORT>', 'database server port number', parseInt)
  .option('--postgresql-username <POSTGRESQL_USERNAME>', 'connect as specified database user')
  .option('--postgresql-no-password', 'never prompt for password')
  .option('--postgresql-password', 'force password prompt (should happen automatically)')
  .addHelpText('after', `
    TIPS:
      You can omit entering the DB password by setting it as an environment variable like this: \`export PGPASSWORD="password"\
      `.replace(/^ {4}/mg, ''))
  .addHelpText('after', `
    NOTICE:
      PostgreSQL options are "--postgresql-XXX", which corresponds to the "--XXX" option of the tool used internally.
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

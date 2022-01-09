#!/usr/bin/env node

import { program } from 'commander';
import {
  configExistS3, createConfigS3,
  execute,
  AbstractRestoreCLI,
  IRestoreCLIOption,
  convertOption,
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

  convertOption(option: IRestoreCLIOption): Record<string, string> {
    const optionPrefix = 'postgresql';
    return convertOption(Object(option), optionPrefix);
  }

  async restore(sourcePath: string, psqlRequiredOptions?: Record<string, string>) {
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

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  /* Required fields that are intentionally treat as optional so that they can be specified by environment variables. */
  .option('--aws-region <AWS_REGION>', 'AWS Region')
  .option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID', process.env.AWS_ACCESS_KEY_ID)
  .option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key', process.env.AWS_SECRET_ACCESS_KEY)
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
    if (!configExistS3()) {
      if (options.awsRegion == null || options.awsAccessKeyId == null || options.awsSecretAccessKey == null) {
        console.error('If the configuration file does not exist, '
                      + 'you will need to set "--aws-region", "--aws-access-key-id", and "--aws-secret-access-key".');
        return;
      }

      /* If the configuration file does not exist, it is created temporarily from the options,
        and it will be deleted when process exit. */
      const { awsRegion, awsAccessKeyId, awsSecretAccessKey } = options;
      createConfigS3({ awsRegion, awsAccessKeyId, awsSecretAccessKey });
    }

    const targetBucketUrl = new URL(targetBucketUrlString);
    try {
      await new PostgreSQLRestoreCLI().main(targetBucketUrl, options);
    }
    catch (e: any) {
      console.error(e);
    }
  });

program.parse(process.argv);

#!/usr/bin/env node

import { program } from 'commander';
import { basename, join } from 'path';
import { format } from 'date-fns';
import {
  generateProvider,
  configExistS3, createConfigS3, unlinkConfigS3,
  compress,
} from '@awesome-backup/core';
import { backup, convertOption } from '@awesome-backup/postgresql';
import { PACKAGE_VERSION } from '@awesome-backup/postgresql/config/version';

const tmp = require('tmp');
const schedule = require('node-schedule');
import { promisify } from 'util';
const exec = promisify(require('child_process').exec);


async function main(targetBucketUrl: string, options: Record<string, string>) {
  tmp.dir({ unsafeCleanup: true }, async(error: any, path: string, cleanUpCallback: any) => {
    try {
      console.log(`=== ${basename(__filename)} started at ${format(new Date(), 'yyyy/MM/dd HH:mm:ss')} ===`);
      const target = join(path, `${options.backupfilePrefix}-${format(new Date(), 'yyyyMMddHHmmss')}`);

      const noConfiguration = configExistS3();
      if (noConfiguration) {
        if (options.awsRegion == null || options.awsAccessKeyId == null || options.awsSecretAccessKey == null) {
          console.error('If the configuration file does not exist, '
                        + 'you will need to set "--aws-region", "--aws-access-key-id", and "--aws-secret-access-key".');
          return;
        }
      }
      /* If the configuration file does not exist, create it temporarily from the options,
        and delete it when it is no longer needed. */
      if (noConfiguration) {
        createConfigS3(options);
      }

      const provider = generateProvider(targetBucketUrl);
      const pgtoolOption = convertOption(options);
      console.log('dump PostgreSQL...');
      await backup(target, pgtoolOption);
      console.log(`backup ${target}...`);
      const { compressedFilePath } = await compress(target);
      await provider.copyFile(compressedFilePath, targetBucketUrl);

      if (noConfiguration) {
        unlinkConfigS3();
      }
    }
    catch (e: any) {
      console.error(e);
    }
    finally {
      cleanUpCallback();
    }
  });
}

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  /* Required fields that are intentionally treat as optional so that they can be specified by environment variables. */
  .option('--aws-region <AWS_REGION>', 'AWS Region')
  .option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID', process.env.AWS_ACCESS_KEY_ID)
  .option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key', process.env.AWS_SECRET_ACCESS_KEY)
  .option('--backupfile-prefix <BACKUPFILE_PREFIX>', 'Prefix of backup file.', 'backup')
  .option('--cronmode', 'Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically.', false)
  .option('--cron-expression <CRON_EXPRESSION>', 'Cron expression (ex. CRON_EXPRESSION="0 4 * * *" if you want to run at 4:00 every day)')
  // [TODO] implement below option
  // .option('--healthcheck-url <HEALTHCHECK_URL>', 'URL that gets called after a successful backup (eg. https://healthchecks.io)')
  /*
   * PostgreSQL options are "--postgresql-XXX", which corresponds to the "--XXX" option of the tool used internally.
   * !!! These options may not available depending on the version of the tool used internally. !!!
   */
  /* Connection options */
  .option('--postgresql-dbname <POSTGRESQL_CONNSTR>', 'connect using connection string')
  .option('--postgresql-host <POSTGRESQL_HOST>', 'database server host or socket directory')
  .option('--postgresql-database <POSTGRESQL_DBNAME>', 'alternative default database')
  .option('--postgresql-port <POSTGRESQL_PORT>', 'database server port number')
  .option('--postgresql-username <POSTGRESQL_USERNAME>', 'connect as specified database user')
  .option('--postgresql-no-password', 'never prompt for password')
  .option('--postgresql-password', 'force password prompt (should happen automatically)')
  .option('--postgresql-role <POSTGRESQL_ROLE>', 'do SET ROLE before dump')
  /* Options controlling the output content */
  .option('--postgresql-data-only', 'dump only the data, not the schema')
  .option('--postgresql-clean', 'clean (drop) databases before recreating')
  .option('--postgresql-encoding=ENCODING', 'dump the data in encoding ENCODING')
  .option('--postgresql-globals-only', 'dump only global objects, no databases')
  .option('--postgresql-no-owner', 'skip restoration of object ownership')
  .option('--postgresql-roles-only', 'dump only roles, no databases or tablespaces')
  .option('--postgresql-schema-only', 'dump only the schema, no data')
  .option('--postgresql-superuser=NAME', 'superuser user name to use in the dump')
  .option('--postgresql-tablespaces-only', 'dump only tablespaces, no databases or roles')
  .option('--postgresql-no-privileges', 'do not dump privileges (grant/revoke)')
  .option('--postgresql-binary-upgrade', 'for use by upgrade utilities only')
  .option('--postgresql-column-inserts', 'dump data as INSERT commands with column names')
  .option('--postgresql-disable-dollar-quoting', 'disable dollar quoting, use SQL standard quoting')
  .option('--postgresql-disable-triggers', 'disable triggers during data-only restore')
  .option('--postgresql-exclude-database=PATTERN', 'exclude databases whose name matches PATTERN')
  .option('--postgresql-extra-float-digits=NUM', 'override default setting for extra_float_digits')
  .option('--postgresql-if-exists', 'use IF EXISTS when dropping objects')
  .option('--postgresql-inserts', 'dump data as INSERT commands, rather than COPY')
  .option('--postgresql-load-via-partition-root', 'load partitions via the root table')
  .option('--postgresql-no-comments', 'do not dump comments')
  .option('--postgresql-no-publications', 'do not dump publications')
  .option('--postgresql-no-role-passwords', 'do not dump passwords for roles')
  .option('--postgresql-no-security-labels', 'do not dump security label assignments')
  .option('--postgresql-no-subscriptions', 'do not dump subscriptions')
  .option('--postgresql-no-sync', 'do not wait for changes to be written safely to disk')
  .option('--postgresql-no-tablespaces', 'do not dump tablespace assignments')
  .option('--postgresql-no-unlogged-table-data', 'do not dump unlogged table data')
  .option('--postgresql-on-conflict-do-nothing', 'add ON CONFLICT DO NOTHING to INSERT commands')
  .option('--postgresql-quote-all-identifiers', 'quote all identifiers, even if not key words')
  .option('--postgresql-rows-per-insert=NROWS', 'number of rows per INSERT; implies --inserts')
  .option('--postgresql-use-set-session-authorization', 'use SET SESSION AUTHORIZATION commands instead of ALTER OWNER commands to set ownership')
  .addHelpText('after', `
    TIPS:
      You can omit entering the DB password by setting it as an environment variable like this: \`export PGPASSWORD="password"\
      `.replace(/^ {4}/mg, ''))
  .addHelpText('after', `
    NOTICE:
      PostgreSQL options are "--postgresql-XXX", which corresponds to the "--XXX" option of the tool used internally.
      These options may not available depending on the version of the tool.
      `.replace(/^ {4}/mg, ''))
  .action(async(targetBucketUrl, options) => {
    if (options.cronmode) {
      if (options.cronExpression == null) {
        console.error('The option "--cron-expression" must be specified in cron mode.');
        return;
      }
      console.log(`=== started in cron mode ${format(new Date(), 'yyyy/MM/dd HH:mm:ss')} ===`);
      schedule.scheduleJob(options.cronExpression, async() => {
        await main(targetBucketUrl, options);
      });
    }
    else {
      await main(targetBucketUrl, options);
    }
  });

program.parse(process.argv);

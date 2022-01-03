#!/usr/bin/env node

/**
 * Usage: backup [options] <TARGET_BUCKET_URL>
 *
 * Arguments:
 *   TARGET_BUCKET_URL                                     URL of target bucket
 *
 * Options:
 *   -V, --version                                         output the version number
 *   --aws-region <AWS_REGION>                             AWS Region
 *   --aws-access-key-id <AWS_ACCESS_KEY_ID>               Your IAM Access Key ID
 *   --aws-secret-access-key <AWS_SECRET_ACCESS_KEY>       Your IAM Secret Access Key
 *   --backupfile-prefix                                   Prefix of backup file. (default: "backup")
 *   --cronmode                                            Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically. (default: false)
 *   --healthcheck-url <HEALTHCHECK_URL>                   URL that gets called after a successful backup (eg. https://healthchecks.io)
 *   --postgresql-host <POSTGRESQL_HOST>                   database server host or socket directory
 *   --postgresql-port <POSTGRESQL_PORT>                   database server port number
 *   --postgresql-username <POSTGRESQL_USERNAME>           connect as specified database user
 *   --postgresql-no-password                              never prompt for password
 *   --postgresql-password                                 force password prompt (should happen automatically)
 *   --postgresql-role <POSTGRESQL_ROLE>                   do SET ROLE before dump
 *   --postgresql-data-only                                dump only the data, not the schema
 *   --postgresql-blobs                                    include large objects in dump
 *   --postgresql-no-blobs                                 exclude large objects in dump
 *   --postgresql-clean                                    clean (drop) database objects before recreating
 *   --postgresql-create                                   include commands to create database in dump
 *   --postgresql-encoding <POSTGRESQL_ENCODING>           dump the data in encoding ENCODING
 *   --postgresql-schema <POSTGRESQL_PATTERN>              dump the specified schema(s) only
 *   --postgresql-exclude-schema <POSTGRESQL_PATTERN>      do NOT dump the specified schema(s)
 *   --postgresql-no-owner                                 skip restoration of object ownership in plain-text format
 *   --postgresql-schema-only                              dump only the schema, no data
 *   --postgresql-superuser <POSTGRESQL_NAME>              superuser user name to use in plain-text format
 *   --postgresql-table <POSTGRESQL_PATTERN>               dump the specified table(s) only
 *   --postgresql-exclude-table <POSTGRESQL_PATTERN>       do NOT dump the specified table(s)
 *   --postgresql-no-privileges                            do not dump privileges (grant/revoke)
 *   --postgresql-binary-upgrade                           for use by upgrade utilities only
 *   --postgresql-column-inserts                           dump data as INSERT commands with column names
 *   --postgresql-disable-dollar-quoting                   disable dollar quoting, use SQL standard quoting
 *   --postgresql-disable-triggers                         disable triggers during data-only restore
 *   --postgresql-enable-row-security                      enable row security (dump only content user has access to)
 *   --postgresql-exclude-table-data <POSTGRESQL_PATTERN>  do NOT dump data for the specified table(s)
 *   --postgresql-extra-float-digits <POSTGRESQL_NUM>      override default setting for extra_float_digits
 *   --postgresql-if-exists                                use IF EXISTS when dropping objects
 *   --postgresql-inserts                                  dump data as INSERT commands, rather than COPY
 *   --postgresql-load-via-partition-root                  load partitions via the root table
 *   --postgresql-no-comments                              do not dump comments
 *   --postgresql-no-publications                          do not dump publications
 *   --postgresql-no-security-labels                       do not dump security label assignments
 *   --postgresql-no-subscriptions                         do not dump subscriptions
 *   --postgresql-no-synchronized-snapshots                do not use synchronized snapshots in parallel jobs
 *   --postgresql-no-tablespaces                           do not dump tablespace assignments
 *   --postgresql-no-unlogged-table-data                   do not dump unlogged table data
 *   --postgresql-on-conflict-do-nothing                   add ON CONFLICT DO NOTHING to INSERT commands
 *   --postgresql-quote-all-identifiers                    quote all identifiers, even if not key words
 *   --postgresql-rows-per-insert <POSTGRESQL_NROWS>       number of rows per INSERT; implies --inserts
 *   --postgresql-section <POSTGRESQL_SECTION>             dump named section (pre-data, data, or post-data)
 *   --postgresql-serializable-deferrable                  wait until the dump can run without anomalies
 *   --postgresql-snapshot <POSTGRESQL_SNAPSHOT>           use given snapshot for the dump
 *   --postgresql-strict-names                             require table and/or schema include patterns to match at least one entity each
 *   --postgresql-use-set-session-authorization            use SET SESSION AUTHORIZATION commands instead of ALTER OWNER commands to set ownership
 *   -h, --help                                            display help for command
 *
 * TIPS:
 *   You can set an environment variable like this: `export PGPASSWORD="password"`
 */

import { program } from 'commander';
import { basename, join } from 'path';
import { format } from 'date-fns';
import {
  generateProvider,
  configExistS3, createConfigS3, unlinkConfigS3,
} from '@awesome-backup/core';
import { backup, compress, convertOption } from '@awesome-backup/postgresql';
import { PACKAGE_VERSION } from '@awesome-backup/postgresql/config/version';

const tmp = require('tmp');

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  /* Required fields that are intentionally treat as optional so that they can be specified by environment variables. */
  .option('--aws-region <AWS_REGION>', 'AWS Region')
  .option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID', process.env.AWS_ACCESS_KEY_ID)
  .option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key', process.env.AWS_SECRET_ACCESS_KEY)
  .option('--backupfile-prefix', 'Prefix of backup file.', 'backup')
  .option('--cronmode', 'Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically.', false)
  .option('--healthcheck-url <HEALTHCHECK_URL>', 'URL that gets called after a successful backup (eg. https://healthchecks.io)')
  /* PostgreSQL options are "--postgresql-XXX", which corresponds to the "--XXX" option of the tool used internally. */
  .option('--postgresql-host <POSTGRESQL_HOST>', 'database server host or socket directory')
  .option('--postgresql-port <POSTGRESQL_PORT>', 'database server port number')
  .option('--postgresql-username <POSTGRESQL_USERNAME>', 'connect as specified database user')
  .option('--postgresql-no-password', 'never prompt for password')
  .option('--postgresql-password', 'force password prompt (should happen automatically)')
  .option('--postgresql-role <POSTGRESQL_ROLE>', 'do SET ROLE before dump')
  .option('--postgresql-data-only', 'dump only the data, not the schema')
  .option('--postgresql-blobs', 'include large objects in dump')
  .option('--postgresql-no-blobs', 'exclude large objects in dump')
  .option('--postgresql-clean', 'clean (drop) database objects before recreating')
  .option('--postgresql-create', 'include commands to create database in dump')
  .option('--postgresql-encoding <POSTGRESQL_ENCODING>', 'dump the data in encoding ENCODING')
  .option('--postgresql-schema <POSTGRESQL_PATTERN>', 'dump the specified schema(s) only')
  .option('--postgresql-exclude-schema <POSTGRESQL_PATTERN>', 'do NOT dump the specified schema(s)')
  .option('--postgresql-no-owner', 'skip restoration of object ownership in plain-text format')
  .option('--postgresql-schema-only', 'dump only the schema, no data')
  .option('--postgresql-superuser <POSTGRESQL_NAME>', 'superuser user name to use in plain-text format')
  .option('--postgresql-table <POSTGRESQL_PATTERN>', 'dump the specified table(s) only')
  .option('--postgresql-exclude-table <POSTGRESQL_PATTERN>', 'do NOT dump the specified table(s)')
  .option('--postgresql-no-privileges', 'do not dump privileges (grant/revoke)')
  .option('--postgresql-binary-upgrade', 'for use by upgrade utilities only')
  .option('--postgresql-column-inserts', 'dump data as INSERT commands with column names')
  .option('--postgresql-disable-dollar-quoting', 'disable dollar quoting, use SQL standard quoting')
  .option('--postgresql-disable-triggers', 'disable triggers during data-only restore')
  .option('--postgresql-enable-row-security', 'enable row security (dump only content user has access to)')
  .option('--postgresql-exclude-table-data <POSTGRESQL_PATTERN>', 'do NOT dump data for the specified table(s)')
  .option('--postgresql-extra-float-digits <POSTGRESQL_NUM>', 'override default setting for extra_float_digits')
  .option('--postgresql-if-exists', 'use IF EXISTS when dropping objects')
  .option('--postgresql-inserts', 'dump data as INSERT commands, rather than COPY')
  .option('--postgresql-load-via-partition-root', 'load partitions via the root table')
  .option('--postgresql-no-comments', 'do not dump comments')
  .option('--postgresql-no-publications', 'do not dump publications')
  .option('--postgresql-no-security-labels', 'do not dump security label assignments')
  .option('--postgresql-no-subscriptions', 'do not dump subscriptions')
  .option('--postgresql-no-synchronized-snapshots', 'do not use synchronized snapshots in parallel jobs')
  .option('--postgresql-no-tablespaces', 'do not dump tablespace assignments')
  .option('--postgresql-no-unlogged-table-data', 'do not dump unlogged table data')
  .option('--postgresql-on-conflict-do-nothing', 'add ON CONFLICT DO NOTHING to INSERT commands')
  .option('--postgresql-quote-all-identifiers', 'quote all identifiers, even if not key words')
  .option('--postgresql-rows-per-insert <POSTGRESQL_NROWS>', 'number of rows per INSERT; implies --inserts')
  .option('--postgresql-section <POSTGRESQL_SECTION>', 'dump named section (pre-data, data, or post-data)')
  .option('--postgresql-serializable-deferrable', 'wait until the dump can run without anomalies')
  .option('--postgresql-snapshot <POSTGRESQL_SNAPSHOT>', 'use given snapshot for the dump')
  .option('--postgresql-strict-names', 'require table and/or schema include patterns to match at least one entity each')
  .option('--postgresql-use-set-session-authorization', 'use SET SESSION AUTHORIZATION commands instead of ALTER OWNER commands to set ownership')
  .addHelpText('after', `
    TIPS:
      You can set an environment variable like this: \`export PGPASSWORD="password"\`
    `.replace(/^ {4}/mg, ''))
  .action(async(targetBucketUrl, options) => {
    tmp.dir({ unsafeCleanup: true }, async(error: any, path: string, cleanUpCallback: any) => {
      try {
        console.log(`=== ${basename(__filename)} started at ${Date().toLocaleString()} ===`);
        const target = join(path, `${format(new Date(), 'yyyyMMddHHmmss')}`);

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
  });

program.parse(process.argv);

#!/usr/bin/env node

import { program } from 'commander';
import {
  configExistS3, createConfigS3,
  execute,
  AbstractBackupCLI, IBackupCLIOption,
  convertOptionAsCamelCase,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../src/config/version';

/* Backup command option types */
declare interface IMongoDBBackupOption extends IBackupCLIOption {
  mongodbHost: string,
  mongodbPort: number,
  mongodbGssapiServiceName: string,
  mongodbGssapiHostName: string,
  mongodbSsl: boolean,
  mongodbSslCAFile: string,
  mongodbSslPEMKeyFile: string,
  mongodbSslPEMKeyPassword: string,
  mongodbSslCRLFile: string,
  mongodbSslAllowInvalidCertificates: boolean,
  mongodbSslAllowInvalidHostnames: boolean,
  mongodbSslFIPSMode: boolean,
  mongodbUsername: string,
  mongodbPassword: string,
  mongodbAuthenticationDatabase: string,
  mongodbAuthenticationMechanism: string,
  mongodbDb: string,
  mongodbCollection: string,
  mongodbUri: string,
  mongodbQuery: string,
  mongodbQueryFile: string,
  mongodbReadPreference: string,
  mongodbForceTableScan: boolean,
}

class MongoDBBackupCLI extends AbstractBackupCLI {

  convertOption(option: IBackupCLIOption): Record<string, string|number|boolean|string[]|number[]> {
    const optionPrefix = 'mongodb';
    return convertOptionAsCamelCase(Object(option), optionPrefix);
  }

  async backup(destinationPath: string, mongodumpRequiredOptions?: Record<string, string|number|boolean|string[]|number[]>): Promise<string[]> {
    const backupCommand = 'mongodump';
    const mongodumpDefaultOptions: Record<string, string> = {
    };
    const outputOption: Record<string, string> = {
      '--out': destinationPath,
    };
    const mongodumpArgs = '';
    console.log('dump MongoDB...');
    console.debug(`backupCommand: ${backupCommand}, mongodumpRequiredOptions: ${JSON.stringify(mongodumpRequiredOptions)}, mongodumpArgs: ${mongodumpArgs}`);
    return execute(backupCommand, [mongodumpArgs], { ...(mongodumpRequiredOptions || {}), ...outputOption }, mongodumpDefaultOptions);
  }

}

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  // Required fields that are intentionally treat as optional so that they can be specified by environment variables.
  .option('--aws-region <AWS_REGION>', 'AWS Region')
  .option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID', process.env.AWS_ACCESS_KEY_ID)
  .option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key', process.env.AWS_SECRET_ACCESS_KEY)
  .option('--backupfile-prefix <BACKUPFILE_PREFIX>', 'Prefix of backup file.', 'backup')
  .option('--cronmode', 'Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically.', false)
  .option('--cron-expression <CRON_EXPRESSION>', 'Cron expression (ex. CRON_EXPRESSION="0 4 * * *" if you want to run at 4:00 every day)')
  .option('--healthcheck-url <HEALTHCHECK_URL>', 'URL that gets called after a successful backup (eg. https://healthchecks.io)')
  /*
   * MongoDB options are "--mongodb-XXX", which corresponds to the "--XXX" option of the tool used internally.
   * !!! These options may not available depending on the version of the tool used internally. !!!
   */
  /* connection options */
  .option('--mongodb-host <MONGODB_hostname>', 'mongodb host to connect to (setname/host1,host2 for replica sets)', 'mongo')
  .option('--mongodb-port <MONGODB_port>', 'server port (can also use --host hostname:port)', parseInt)
  /* kerberos options */
  .option('--mongodb-gssapiServiceName <MONGODB_SERVICE_NAME>', 'service name to use when authenticating using GSSAPI/Kerberos (\'mongodb\' by default)')
  .option('--mongodb-gssapiHostName <MONGODB_HOST_NAME>', 'hostname to use when authenticating using GSSAPI/Kerberos (remote server\'s address by default)')
  /* ssl options */
  .option('--mongodb-ssl', 'connect to a mongod or mongos that has ssl enabled')
  .option('--mongodb-sslCAFile <filename>', 'the .pem file containing the root certificate chain from the certificate authority')
  .option('--mongodb-sslPEMKeyFile <filename>', 'the .pem file containing the certificate and key')
  .option('--mongodb-sslPEMKeyPassword <password>', 'the password to decrypt the sslPEMKeyFile, if necessary')
  .option('--mongodb-sslCRLFile <filename>', 'the .pem file containing the certificate revocation list')
  .option('--mongodb-sslAllowInvalidCertificates', 'bypass the validation for server certificates')
  .option('--mongodb-sslAllowInvalidHostnames', 'bypass the validation for server name')
  .option('--mongodb-sslFIPSMode', 'use FIPS mode of the installed openssl library')
  /* authentication options */
  .option('--mongodb-username <username>', 'username for authentication')
  .option('--mongodb-password <password>', 'password for authentication')
  .option('--mongodb-authenticationDatabase <database-name>', 'database that holds the user\'s credentials')
  .option('--mongodb-authenticationMechanism <mechanism>', 'authentication mechanism to use')
  /* namespace options */
  .option('--mongodb-db <database-name>', 'database to use')
  .option('--mongodb-collection <collection-name>', 'collection to use')
  /* uri options */
  .option('--mongodb-uri <mongodb-uri>', 'mongodb uri connection string')
  /* query options */
  .option('--mongodb-query <query>', 'query filter, as a JSON string, e.g., \'{x:{$gt:1}}\'')
  .option('--mongodb-queryFile <file>', 'path to a file containing a query filter (JSON)')
  .option('--mongodb-readPreference <string|json>', 'specify either a preference name or a preference json object')
  .option('--mongodb-forceTableScan', 'force a table scan')
  .addHelpText('after', `
    NOTICE:
      MongoDB options are "--mongodb-XXX", which corresponds to the "--XXX" option of the tool used internally.
      These options may not available depending on the version of the tool.
      `.replace(/^ {4}/mg, ''))
  .action(async(targetBucketUrlString, options: IMongoDBBackupOption) => {
    if (options.cronmode && options.cronExpression == null) {
      console.error('The option "--cron-expression" must be specified in cron mode.');
      return;
    }
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

    try {
      const targetBucketUrl = new URL(targetBucketUrlString);
      if (options.cronmode) {
        await new MongoDBBackupCLI().mainCronMode(targetBucketUrl, options);
      }
      else {
        await new MongoDBBackupCLI().main(targetBucketUrl, options);
      }
    }
    catch (e: any) {
      console.error(e);
    }
  });

program.parse(process.argv);

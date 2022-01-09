#!/usr/bin/env node

import { program } from 'commander';
import {
  configExistS3, createConfigS3,
  execute,
  AbstractRestoreCLI,
  IRestoreCLIOption,
  convertOptionAsCamelCase,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../src/config/version';

/* Restore command option types */
declare interface IMongoDBRestoreOption extends IRestoreCLIOption {
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
  mongodbUri: string,
  mongodbDb: string,
  mongodbCollection: string,
  mongodbExcludeCollection: string[],
  mongodbExcludeCollectionsWithPrefix: string[],
  mongodbNsExclude: string,
  mongodbNsInclude: string,
  mongodbNsFrom: string,
  mongodbNsTo: string,
  mongodbObjcheck: boolean,
  mongodbOplogReplay: boolean,
  mongodbOplogLimit: number,
  mongodbOplogFile: string,
  mongodbArchive: string,
  mongodbRestoreDbUsersAndRoles: boolean,
  mongodbDir: string,
  mongodbGzip: boolean,
  mongodbDrop: boolean,
  mongodbDryRun: boolean,
  mongodbWriteConcern: string,
  mongodbNoIndexRestore: boolean,
  mongodbNoOptionsRestore: boolean,
  mongodbKeepIndexVersion: boolean,
  mongodbMaintainInsertionOrder: boolean,
  mongodbNumParallelCollections: number,
  mongodbNumInsertionWorkersPerCollection: number,
  mongodbStopOnError: boolean,
  mongodbBypassDocumentValidation: boolean,
}

class MongoDBRestoreCLI extends AbstractRestoreCLI {

  convertOption(option: IRestoreCLIOption): Record<string, string|number|boolean|string[]|number[]> {
    const optionPrefix = 'mongodb';
    return convertOptionAsCamelCase(Object(option), optionPrefix);
  }

  async restore(sourcePath: string, mongorestoreRequiredOptions?: Record<string, string|number|boolean|string[]|number[]>) {
    const restoreCommand = 'mongorestore';
    const mongorestoreDefaultOptions: Record<string, string> = {
    };
    const mongorestoreArgs = sourcePath;
    return execute(restoreCommand, [mongorestoreArgs], mongorestoreRequiredOptions || {}, mongorestoreDefaultOptions, false);
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
   * MongoDB options are "--mongodb-XXX", which corresponds to the "--XXX" option of the tool used internally.
   * !!! These options may not available depending on the version of the tool used internally. !!!
   */
  /* connection options */
  .option('--mongodb-host <hostname>', 'mongodb host to connect to (setname/host1,host2 for replica sets)')
  .option('--mongodb-port <port>', 'server port (can also use --host hostname:port)', parseInt)
  /* kerberos options */
  .option('--mongodb-gssapiServiceName <service-name>', 'service name to use when authenticating using GSSAPI/Kerberos (\'mongodb\' by default)')
  .option('--mongodb-gssapiHostName <host-name>', 'hostname to use when authenticating using GSSAPI/Kerberos (remote server\'s address by default)')
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
  .option('--mongodb-authenticationDatabase <database-name> ', 'database that holds the user\'s credentials')
  .option('--mongodb-authenticationMechanism <mechanism>', 'authentication mechanism to use')
  /* uri options */
  .option('--mongodb-uri mongodb-uri', 'mongodb uri connection string')
  /* namespace options */
  .option('--mongodb-db <database-name>', 'database to use when restoring from a BSON file')
  .option('--mongodb-collection <collection-name>', 'collection to use when restoring from a BSON file')
  .option('--mongodb-excludeCollection [collection-name...]', 'DEPRECATED; collection to skip over during restore')
  .option('--mongodb-excludeCollectionsWithPrefix [collection-prefix...] ', 'DEPRECATED; collections to skip over during restore that have the given prefix')
  .option('--mongodb-nsExclude <namespace-pattern>', 'exclude matching namespaces')
  .option('--mongodb-nsInclude <namespace-pattern>', 'include matching namespaces')
  .option('--mongodb-nsFrom <namespace-pattern>', 'rename matching namespaces, must have matching nsTo')
  .option('--mongodb-nsTo <namespace-pattern>', 'rename matched namespaces, must have matching nsFrom')
  /* input options */
  .option('--mongodb-objcheck', 'validate all objects before inserting')
  .option('--mongodb-oplogReplay', 'replay oplog for point-in-time restore')
  .option('--mongodb-oplogLimit <seconds>', 'only include oplog entries before the provided Timestamp', parseInt)
  .option('--mongodb-oplogFile <filename>', 'oplog file to use for replay of oplog')
  .option('--mongodb-archive <filename>', 'restore dump from the specified archive file.  If flag is specified without a value, archive is read from stdin')
  .option('--mongodb-restoreDbUsersAndRoles', 'restore user and role definitions for the given database')
  .option('--mongodb-dir <directory-name>', 'input directory, use \'-\' for stdin')
  .option('--mongodb-gzip', 'decompress gzipped input')
  /* restore options */
  .option('--mongodb-drop', 'drop each collection before import')
  .option('--mongodb-dryRun', 'view summary without importing anything. recommended with verbosity')
  .option('--mongodb-writeConcern <write-concern>',
    'write concern options e.g. --writeConcern majority, --writeConcern \'{w: 3, wtimeout: 500, fsync: true, j: true}\'')
  .option('--mongodb-noIndexRestore', 'don\'t restore indexes')
  .option('--mongodb-noOptionsRestore', 'don\'t restore collection options')
  .option('--mongodb-keepIndexVersion', 'don\'t update index version')
  .option('--mongodb-maintainInsertionOrder', 'preserve order of documents during restoration')
  .option('--mongodb-numParallelCollections <num>', 'number of collections to restore in parallel (4 by default) (default: 4)', parseInt)
  .option('--mongodb-numInsertionWorkersPerCollection <num>',
    'number of insert operations to run concurrently per collection (1 by default) (default: 1)', parseInt)
  .option('--mongodb-stopOnError', 'stop restoring if an error is encountered on insert (off by default)')
  .option('--mongodb-bypassDocumentValidation', 'bypass document validation')
  .addHelpText('after', `
    NOTICE:
      MongoDB options are "--mongodb-XXX", which corresponds to the "--XXX" option of the tool used internally.
      These options may not available depending on the version of the tool.
      `.replace(/^ {4}/mg, ''))
  .action(async(targetBucketUrlString, options: IMongoDBRestoreOption) => {
    console.log(options);
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
      await new MongoDBRestoreCLI().main(targetBucketUrl, options);
    }
    catch (e: any) {
      console.error(e);
    }
  });

program.parse(process.argv);

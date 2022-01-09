# mongodb

Awesome backup tools of MongoDB.

## Usage

### How to backup

```bash
$ yarn run build
$ node dist/mongodb/bin/backup
```

```
Usage: backup [options] <TARGET_BUCKET_URL>

Arguments:
  TARGET_BUCKET_URL                                   URL of target bucket

Options:
  -V, --version                                       output the version number
  --aws-region <AWS_REGION>                           AWS Region
  --aws-access-key-id <AWS_ACCESS_KEY_ID>             Your IAM Access Key ID
  --aws-secret-access-key <AWS_SECRET_ACCESS_KEY>     Your IAM Secret Access Key
  --backupfile-prefix <BACKUPFILE_PREFIX>             Prefix of backup file. (default: "backup")
  --cronmode                                          Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically. (default: false)
  --cron-expression <CRON_EXPRESSION>                 Cron expression (ex. CRON_EXPRESSION="0 4 * * *" if you want to run at 4:00 every day)
  --mongodb-host <MONGODB_hostname>                   mongodb host to connect to (setname/host1,host2 for replica sets) (default: "mongo")
  --mongodb-port <MONGODB_port>                       server port (can also use --host hostname:port)
  --mongodb-gssapiServiceName <MONGODB_SERVICE_NAME>  service name to use when authenticating using GSSAPI/Kerberos ('mongodb' by default)
  --mongodb-gssapiHostName <MONGODB_HOST_NAME>        hostname to use when authenticating using GSSAPI/Kerberos (remote server's address by default)
  --mongodb-ssl                                       connect to a mongod or mongos that has ssl enabled
  --mongodb-sslCAFile <filename>                      the .pem file containing the root certificate chain from the certificate authority
  --mongodb-sslPEMKeyFile <filename>                  the .pem file containing the certificate and key
  --mongodb-sslPEMKeyPassword <password>              the password to decrypt the sslPEMKeyFile, if necessary
  --mongodb-sslCRLFile <filename>                     the .pem file containing the certificate revocation list
  --mongodb-sslAllowInvalidCertificates               bypass the validation for server certificates
  --mongodb-sslAllowInvalidHostnames                  bypass the validation for server name
  --mongodb-sslFIPSMode                               use FIPS mode of the installed openssl library
  --mongodb-username <username>                       username for authentication
  --mongodb-password <password>                       password for authentication
  --mongodb-authenticationDatabase <database-name>    database that holds the user's credentials
  --mongodb-authenticationMechanism <mechanism>       authentication mechanism to use
  --mongodb-db <database-name>                        database to use
  --mongodb-collection <collection-name>              collection to use
  --mongodb-uri <mongodb-uri>                         mongodb uri connection string
  --mongodb-query <query>                             query filter, as a JSON string, e.g., '{x:{$gt:1}}'
  --mongodb-queryFile <file>                          path to a file containing a query filter (JSON)
  --mongodb-readPreference <string|json>              specify either a preference name or a preference json object
  --mongodb-forceTableScan                            force a table scan
  -h, --help                                          display help for command

NOTICE:
  MongoDB options are "--mongodb-XXX", which corresponds to the "--XXX" option of the tool used internally.
  These options may not available depending on the version of the tool.
```

### How to restore

```bash
$ yarn run build
$ node dist/mongodb/bin/restore
```

```
Usage: restore [options] <TARGET_BUCKET_URL>

Arguments:
  TARGET_BUCKET_URL                                               URL of target bucket

Options:
  -V, --version                                                   output the version number
  --aws-region <AWS_REGION>                                       AWS Region
  --aws-access-key-id <AWS_ACCESS_KEY_ID>                         Your IAM Access Key ID
  --aws-secret-access-key <AWS_SECRET_ACCESS_KEY>                 Your IAM Secret Access Key
  --mongodb-host <hostname>                                       mongodb host to connect to (setname/host1,host2 for replica sets)
  --mongodb-port <port>                                           server port (can also use --host hostname:port)
  --mongodb-gssapiServiceName <service-name>                      service name to use when authenticating using GSSAPI/Kerberos ('mongodb' by default)
  --mongodb-gssapiHostName <host-name>                            hostname to use when authenticating using GSSAPI/Kerberos (remote server's address by default)
  --mongodb-ssl                                                   connect to a mongod or mongos that has ssl enabled
  --mongodb-sslCAFile <filename>                                  the .pem file containing the root certificate chain from the certificate authority
  --mongodb-sslPEMKeyFile <filename>                              the .pem file containing the certificate and key
  --mongodb-sslPEMKeyPassword <password>                          the password to decrypt the sslPEMKeyFile, if necessary
  --mongodb-sslCRLFile <filename>                                 the .pem file containing the certificate revocation list
  --mongodb-sslAllowInvalidCertificates                           bypass the validation for server certificates
  --mongodb-sslAllowInvalidHostnames                              bypass the validation for server name
  --mongodb-sslFIPSMode                                           use FIPS mode of the installed openssl library
  --mongodb-username <username>                                   username for authentication
  --mongodb-password <password>                                   password for authentication
  --mongodb-authenticationDatabase <database-name>                database that holds the user's credentials
  --mongodb-authenticationMechanism <mechanism>                   authentication mechanism to use
  --mongodb-uri mongodb-uri                                       mongodb uri connection string
  --mongodb-db <database-name>                                    database to use when restoring from a BSON file
  --mongodb-collection <collection-name>                          collection to use when restoring from a BSON file
  --mongodb-excludeCollection [collection-name...]                DEPRECATED; collection to skip over during restore
  --mongodb-excludeCollectionsWithPrefix [collection-prefix...]   DEPRECATED; collections to skip over during restore that have the given prefix
  --mongodb-nsExclude <namespace-pattern>                         exclude matching namespaces
  --mongodb-nsInclude <namespace-pattern>                         include matching namespaces
  --mongodb-nsFrom <namespace-pattern>                            rename matching namespaces, must have matching nsTo
  --mongodb-nsTo <namespace-pattern>                              rename matched namespaces, must have matching nsFrom
  --mongodb-objcheck                                              validate all objects before inserting
  --mongodb-oplogReplay                                           replay oplog for point-in-time restore
  --mongodb-oplogLimit <seconds>                                  only include oplog entries before the provided Timestamp
  --mongodb-oplogFile <filename>                                  oplog file to use for replay of oplog
  --mongodb-archive <filename>                                    restore dump from the specified archive file.  If flag is specified without a value, archive is read from stdin
  --mongodb-restoreDbUsersAndRoles                                restore user and role definitions for the given database
  --mongodb-dir <directory-name>                                  input directory, use '-' for stdin
  --mongodb-gzip                                                  decompress gzipped input
  --mongodb-drop                                                  drop each collection before import
  --mongodb-dryRun                                                view summary without importing anything. recommended with verbosity
  --mongodb-writeConcern <write-concern>                          write concern options e.g. --writeConcern majority, --writeConcern '{w: 3, wtimeout: 500, fsync: true, j: true}'
  --mongodb-noIndexRestore                                        don't restore indexes
  --mongodb-noOptionsRestore                                      don't restore collection options
  --mongodb-keepIndexVersion                                      don't update index version
  --mongodb-maintainInsertionOrder                                preserve order of documents during restoration
  --mongodb-numParallelCollections <num>                          number of collections to restore in parallel (4 by default) (default: 4)
  --mongodb-numInsertionWorkersPerCollection <num>                number of insert operations to run concurrently per collection (1 by default) (default: 1)
  --mongodb-stopOnError                                           stop restoring if an error is encountered on insert (off by default)
  --mongodb-bypassDocumentValidation                              bypass document validation
  -h, --help                                                      display help for command

NOTICE:
  MongoDB options are "--mongodb-XXX", which corresponds to the "--XXX" option of the tool used internally.
  These options may not available depending on the version of the tool.
```

### How to list

```bash
$ yarn run build
$ node dist/mongodb/bin/list
```

```
Usage: list [options] <TARGET_BUCKET_URL>

Arguments:
  TARGET_BUCKET_URL                                URL of target bucket

Options:
  -V, --version                                    output the version number
  --aws-region <AWS_REGION>                        AWS Region
  --aws-access-key-id <AWS_ACCESS_KEY_ID>          Your IAM Access Key ID
  --aws-secret-access-key <AWS_SECRET_ACCESS_KEY>  Your IAM Secret Access Key
  -h, --help                                       display help for command
```

### How to prune

```bash
$ yarn run build
$ node dist/mongodb/bin/prune
```

```
Usage: prune [options] <TARGET_BUCKET_URL>

Arguments:
  TARGET_BUCKET_URL                                    URL of target bucket

Options:
  -V, --version                                        output the version number
  --aws-region <AWS_REGION>                            AWS Region
  --aws-access-key-id <AWS_ACCESS_KEY_ID>              Your IAM Access Key ID
  --aws-secret-access-key <AWS_SECRET_ACCESS_KEY>      Your IAM Secret Access Key
  --backupfile-prefix <BACKUPFILE_PREFIX>              Prefix of backup file. (default: "backup")
  --delete-divide <DELETE_DIVIDE>                      delete divide (default: 3)
  --delete-target-days-left <DELETE_TARGET_DAYS_LEFT>  How many days ago to be deleted (default: 4)
  -h, --help                                           display help for command
```
# postgresql

Awesome backup tools of PostgreSQL.

## Usage

### How to backup

```bash
$ yarn run build
$ node dist/postgresql/bin/backup
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
  --healthchecks-url <URL>                            URL that gets called after a successful backup (eg. https://healthchecks.io)
  --postgresql-dbname <POSTGRESQL_CONNSTR>            connect using connection string
  --postgresql-host <POSTGRESQL_HOST>                 database server host or socket directory
  --postgresql-database <POSTGRESQL_DBNAME>           alternative default database
  --postgresql-port <POSTGRESQL_PORT>                 database server port number
  --postgresql-username <POSTGRESQL_USERNAME>         connect as specified database user
  --postgresql-no-password                            never prompt for password
  --postgresql-password                               force password prompt (should happen automatically)
  --postgresql-role <POSTGRESQL_ROLE>                 do SET ROLE before dump
  --postgresql-data-only                              dump only the data, not the schema
  --postgresql-clean                                  clean (drop) databases before recreating
  --postgresql-encoding <POSTGRESQL_ENCODING>         dump the data in encoding ENCODING
  --postgresql-globals-only                           dump only global objects, no databases
  --postgresql-no-owner                               skip restoration of object ownership
  --postgresql-roles-only                             dump only roles, no databases or tablespaces
  --postgresql-schema-only                            dump only the schema, no data
  --postgresql-superuser <POSTGRESQL_NAME>            superuser user name to use in the dump
  --postgresql-tablespaces-only                       dump only tablespaces, no databases or roles
  --postgresql-no-privileges                          do not dump privileges (grant/revoke)
  --postgresql-binary-upgrade                         for use by upgrade utilities only
  --postgresql-column-inserts                         dump data as INSERT commands with column names
  --postgresql-disable-dollar-quoting                 disable dollar quoting, use SQL standard quoting
  --postgresql-disable-triggers                       disable triggers during data-only restore
  --postgresql-exclude-database <POSTGRESQL_PATTERN>  exclude databases whose name matches PATTERN
  --postgresql-extra-float-digits <POSTGRESQL_NUM>    override default setting for extra_float_digits
  --postgresql-if-exists                              use IF EXISTS when dropping objects
  --postgresql-inserts                                dump data as INSERT commands, rather than COPY
  --postgresql-load-via-partition-root                load partitions via the root table
  --postgresql-no-comments                            do not dump comments
  --postgresql-no-publications                        do not dump publications
  --postgresql-no-role-passwords                      do not dump passwords for roles
  --postgresql-no-security-labels                     do not dump security label assignments
  --postgresql-no-subscriptions                       do not dump subscriptions
  --postgresql-no-sync                                do not wait for changes to be written safely to disk
  --postgresql-no-tablespaces                         do not dump tablespace assignments
  --postgresql-no-unlogged-table-data                 do not dump unlogged table data
  --postgresql-on-conflict-do-nothing                 add ON CONFLICT DO NOTHING to INSERT commands
  --postgresql-quote-all-identifiers                  quote all identifiers, even if not key words
  --postgresql-rows-per-insert <POSTGRESQL_NROWS>     number of rows per INSERT; implies --inserts
  --postgresql-use-set-session-authorization          use SET SESSION AUTHORIZATION commands instead of ALTER OWNER commands to set ownership
  -h, --help                                          display help for command

TIPS:
  You can omit entering the DB password by setting it as an environment variable like this: `export PGPASSWORD="password"

NOTICE:
  PostgreSQL options are "--postgresql-XXX", which corresponds to the "--XXX" option of the tool used internally.
  These options may not available depending on the version of the tool.
```

### How to restore

```bash
$ yarn run build
$ node dist/postgresql/bin/restore
```

```
Usage: restore [options] <TARGET_BUCKET_URL>

Arguments:
  TARGET_BUCKET_URL                                URL of target bucket

Options:
  -V, --version                                    output the version number
  --aws-region <AWS_REGION>                        AWS Region
  --aws-access-key-id <AWS_ACCESS_KEY_ID>          Your IAM Access Key ID
  --aws-secret-access-key <AWS_SECRET_ACCESS_KEY>  Your IAM Secret Access Key
  --postgresql-host <POSTGRESQL_HOST>              database server host or socket directory
  --postgresql-port <POSTGRESQL_PORT>              database server port number
  --postgresql-username <POSTGRESQL_USERNAME>      connect as specified database user
  --postgresql-no-password                         never prompt for password
  --postgresql-password                            force password prompt (should happen automatically)
  -h, --help                                       display help for command

TIPS:
  You can omit entering the DB password by setting it as an environment variable like this: `export PGPASSWORD="password"

NOTICE:
  PostgreSQL options are "--postgresql-XXX", which corresponds to the "--XXX" option of the tool used internally.
  These options may not available depending on the version of the tool.
```

### How to list

```bash
$ yarn run build
$ node dist/postgresql/bin/list
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
$ node dist/postgresql/bin/prune
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

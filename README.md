[![Application test](https://github.com/ryu-sato/awesome-database-backup/actions/workflows/test.yaml/badge.svg)](https://github.com/ryu-sato/awesome-database-backup/actions/workflows/test.yaml)
[![Container test](https://github.com/ryu-sato/awesome-database-backup/actions/workflows/container-test.yaml/badge.svg)](https://github.com/ryu-sato/awesome-database-backup/actions/workflows/container-test.yaml)

# What is awesome-database-backup

Collection of CLI executable npm packages which backup/restore databases to/from Cloud storage services like Amazon S3 or Google Cloud Storage.

# How to execute

Refer to the "README" corresponding to the database you are using.

- For mongoDB, you can use [awesome-mongodb-backup](./apps/awesome-mongodb-backup)
- For PostgreSQL, you can use [awesome-postgresql-backup](./apps/awesome-postgresql-backup)
- For MariaDB, you can use [awesome-mariadb-backup](./apps/awesome-mariadb-backup)

## Authenticate storage service

* Using S3
    * Set `AWS_REGION` and `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

OR

* Using GCSawesome-database-backupcloud.google.com/storage/docsawesome-database-backups)
  * If using sawesome-database-backup authentication, set `GCP_SERVICawesome-database-backupJSON_PATH` and `GCP_PROJECT_ID`
  * If using HMAC authentication, set `GCP_ACCESS_KEY_ID`, `GCP_SECRET_ACCESS_KEY`, and `GCP_PROJECT_ID`
awesome-database-backupawesome-database-backupawesome-database-backupawesome-database-backup
# Migrate from [weseek/awesome-mongodb-backup](https://github.com/weseek/awesome-mongodb-backup) / [weseek/awesome-mariadb-backup](https://github.com/weseek/awesome-mariadb-backup)

## change environment variable

You must change the following environment variables.
awesome-database-backupawesome-database-backup
| weseek/awesome-mongodb-backup | awesome-database-backup |
| ----------------------------- | -------------- |
| `AWSCLI_ENDPOINT_OPT` | `AWS_ENDPOINT_URL` |
| `GCP_ACCESS_KEY_ID` | `GCP_CLIENT_EMAIL` |
| `GCP_SECRET_ACCESS_KEY` | `GCP_PRIVATE_KEY` |
| `MONGODB_URI` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MONGODB_HOST` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MONGODB_DBNAME` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MONGODB_USERNAME` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MONGODB_PASSWORD` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MONGODB_AUTHDB` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `CRONMODE` | - **NO SETTINGS REQURIED** (Only `CRON_EXPRESSION` needs to be set) |
| `AWSCLIOPT` | - **DISABLED** |
| `GCSCLIOPT` | - **DISABLED** |
awesome-database-backupawesome-database-backup
| weseek/awesome-mariadb-backup | awesome-database-backup |
| ----------------------------- | -------------- |
| `GCP_ACCESS_KEY_ID` | `GCP_CLIENT_EMAIL` |
| `GCP_SECRET_ACCESS_KEY` | `GCP_PRIVATE_KEY` |
| `MARIADB_HOST` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MARIADB_DBNAME` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MARIADB_USERNAME` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MARIADB_PASSWORD` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MYSQLDUMP_OPTS` | `BACKUP_TOOL_OPTIONS` |
| `MYSQL_OPTS` | `RESTORE_TOOL_OPTIONS` |

# How to contribute

see. [CONTRIBUTING](./CONTRIBUTING.md)

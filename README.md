[![Application test](https://github.com/ryu-sato/awesome-backup/actions/workflows/test.yaml/badge.svg)](https://github.com/ryu-sato/awesome-backup/actions/workflows/test.yaml)
[![Container test](https://github.com/ryu-sato/awesome-backup/actions/workflows/container-test.yaml/badge.svg)](https://github.com/ryu-sato/awesome-backup/actions/workflows/container-test.yaml)

# What is awesome-backup

awesome-backup is the collection of npm packages which backup/restore databases to/from Cloud storage services like Amazon S3 or Google Cloud Storage.

# How to execute

Refer to the "README" corresponding to the database you are using.

- For mongoDB, you can use [mongodb-awesome-backup](./apps/mongodb-awesome-backup)
- For PostgreSQL, you can use [postgresql-awesome-backup](./apps/postgresql-awesome-backup)
- For MariaDB, you can use [mariadb-awesome-backup](./apps/mariadb-awesome-backup)

## Authenticate storage service

* Using S3
    * Set `AWS_REGION` and `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

OR

* Using GCS (see https://cloud.google.com/storage/docs/migrating#keys)
  * If using service account authentication, set `GCP_SERVICE_ACCOUNT_KEY_JSON_PATH` and `GCP_PROJECT_ID`
  * If using HMAC authentication, set `GCP_ACCESS_KEY_ID`, `GCP_SECRET_ACCESS_KEY`, and `GCP_PROJECT_ID`

# Migrate from [weseek/mongodb-awesome-backup](https://github.com/weseek/mongodb-awesome-backup) / [weseek/mariadb-awesome-backup](https://github.com/weseek/mariadb-awesome-backup)

## change environment variable

You must change the following environment variables.

| weseek/mongodb-awesome-backup | awesome-backup |
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

| weseek/mariadb-awesome-backup | awesome-backup |
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

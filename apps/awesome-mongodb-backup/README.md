# What is awesome-mongodb-backup

Collection of CLI executable npm packages which backup MongoDB databases to Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Usage

See "README.md" each command follows or run command with "--help" option.

- [mongodb-backup](https://github.com/ryu-sato/awesome-database-backup/blob/master/apps/mongodb-backup/README.md)
- [mongodb-restore](https://github.com/ryu-sato/awesome-database-backup/blob/master/apps/mongodb-restore/README.md)
- [list](https://github.com/ryu-sato/awesome-database-backup/blob/master/apps/list/README.md)
- [prune](https://github.com/ryu-sato/awesome-database-backup/blob/master/apps/prune/README.md)

# Migrate from [weseek/mongodb-awesome-backup](https://github.com/weseek/mongodb-awesome-backup)

## change environment variable

Change the following environment variables.

| weseek/mongodb-awesome-backup | awesome-database-backup |
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

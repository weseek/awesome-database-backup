# What is awesome-mariadb-backup

Collection of CLI executable npm packages which backup MariaDB databases to Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Usage

See "README.md" each command follows or run command with "--help" option.

- [mariadb-backup](https://github.com/ryu-sato/awesome-database-backup/blob/master/apps/mariadb-backup/README.md)
- [mariadb-restore](https://github.com/ryu-sato/awesome-database-backup/blob/master/apps/mariadb-restore/README.md)
- [list](https://github.com/ryu-sato/awesome-database-backup/blob/master/apps/list/README.md)
- [prune](https://github.com/ryu-sato/awesome-database-backup/blob/master/apps/prune/README.md)

## Migrate from [weseek/mariadb-awesome-backup](https://github.com/weseek/mariadb-awesome-backup)

### change environment variable

Change the following environment variables.

| weseek/mariadb-awesome-backup | awesome-mariadb-backup |
| ----------------------------- | -------------- |
| `GCP_ACCESS_KEY_ID` | `GCP_CLIENT_EMAIL` |
| `GCP_SECRET_ACCESS_KEY` | `GCP_PRIVATE_KEY` |
| `MARIADB_HOST` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MARIADB_DBNAME` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MARIADB_USERNAME` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MARIADB_PASSWORD` | `BACKUP_TOOL_OPTIONS` or `RESTORE_TOOL_OPTIONS` |
| `MYSQLDUMP_OPTS` | `BACKUP_TOOL_OPTIONS` |
| `MYSQL_OPTS` | `RESTORE_TOOL_OPTIONS` |

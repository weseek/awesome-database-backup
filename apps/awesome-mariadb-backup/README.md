# What is awesome-mariadb-backup

Collection of CLI executable npm packages which backup MariaDB databases to Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Key Features

- Backup and restore for MariaDB databases
- Support for major cloud storage services (S3, GCS)
- Streaming mode for efficient large data transfers
- Cron scheduling for automated backups
- Docker support for containerized environments

## Installation

```bash
docker pull weseek/awesome-mariadb-backup
```

## Usage

See "README.md" for each command or run command with "--help" option.

- [mariadb-backup](../mariadb-backup/README.md)
- [mariadb-restore](../mariadb-restore/README.md)
- [list](../list/README.md)
- [prune](../prune/README.md)

### With Docker Image

Backed up file names will be time-stamped. (ex. `backup-20220611170158.bz2`)

```bash
# Run MariaDB backup
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/ \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  -e BACKUP_TOOL_OPTIONS="--host mariadb --user root --all-databases" \
  -e MYSQL_PWD=password \
  weseek/awesome-mariadb-backup backup

# Restore from backup
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/backup-20220611170158.bz2 \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  -e RESTORE_TOOL_OPTIONS="--host mariadb --user root --one-database database_name" \
  -e MYSQL_PWD=password \
  weseek/awesome-mariadb-backup restore

# List backup files
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/ \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  weseek/awesome-mariadb-backup list

# Delete old backup files
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/ \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  weseek/awesome-mariadb-backup prune
```

#### Environment Variables

| Variable | Description |
|----------|-------------|
| `TARGET_BUCKET_URL` | Target Bucket URL ([s3://...\|gs://...]) |
| `AWS_REGION` | AWS Region |
| `AWS_ACCESS_KEY_ID` | Your IAM Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | Your IAM Secret Access Key |
| `AWS_ENDPOINT_URL` | URL to send the request to (for S3-compatible services) |
| `GCP_ENDPOINT_URL` | URL to send the request to for GCP |
| `GCP_PROJECT_ID` | GCP Project ID |
| `GCP_SERVICE_ACCOUNT_KEY_JSON_PATH` | JSON file path to your GCP Service Account Key |
| `GCP_CLIENT_EMAIL` | GCP Client Email |
| `GCP_PRIVATE_KEY` | GCP Private Key |
| `BACKUP_TOOL_OPTIONS` | Options to pass to mysqldump command (e.g., "--host mariadb --user root --all-databases") |
| `RESTORE_TOOL_OPTIONS` | Options to pass to mysql command (e.g., "--host mariadb --user root --one-database database_name") |
| `MYSQL_PWD` | MariaDB password (alternative to specifying password in BACKUP/RESTORE_TOOL_OPTIONS) |
| `BACKUPFILE_PREFIX` | Prefix of backup file (default: "backup") |
| `CRON_EXPRESSION` | Cron expression for scheduled backups (e.g., "0 4 * * *" for daily at 4:00 AM) |
| `HEALTHCHECK_URL` | URL that gets called after a successful backup (e.g., https://healthchecks.io) |
| `USE_STREAM` | Set to "true" to use streaming mode for backup (no temporary files) |
| `TZ` | Timezone for timestamps (default: UTC) |

#### Docker Compose Example

```yaml
version: '3'
services:
  mariadb:
    image: mariadb:latest
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=mydb
    volumes:
      - mariadb_data:/var/lib/mysql

  backup:
    image: weseek/awesome-mariadb-backup
    command: backup
    environment:
      - TARGET_BUCKET_URL=s3://my-bucket/backups/
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=your-access-key
      - AWS_SECRET_ACCESS_KEY=your-secret-key
      - BACKUP_TOOL_OPTIONS=--host mariadb --user root --all-databases
      - MYSQL_PWD=password
      - TZ=Asia/Tokyo
    depends_on:
      - mariadb
    restart: no

volumes:
  mariadb_data:
```

## Timezone Settings

Timezone is not set as default so time-stamp show UTC.
If you want to change it, set the `TZ` environment variable. (see. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## Migration from Previous Versions

If you are migrating from [weseek/mariadb-awesome-backup](https://github.com/weseek/mariadb-awesome-backup), you need to change the following environment variables:

| weseek/mariadb-awesome-backup | awesome-mariadb-backup |
| ----------------------------- | ---------------------- |
| `MARIADB_HOST` | `BACKUP_TOOL_OPTIONS` / `RESTORE_TOOL_OPTIONS` |
| `MARIADB_DBNAME` | `BACKUP_TOOL_OPTIONS` / `RESTORE_TOOL_OPTIONS` |
| `MARIADB_USERNAME` | `BACKUP_TOOL_OPTIONS` / `RESTORE_TOOL_OPTIONS` |
| `MARIADB_PASSWORD` | `MYSQL_PWD` |
| `MYSQLDUMP_OPTS` / `MYSQL_OPTS` | `BACKUP_TOOL_OPTIONS` / `RESTORE_TOOL_OPTIONS` |

For more details, see:
- [mariadb-backup](../mariadb-backup/README.md)
- [mariadb-restore](../mariadb-restore/README.md)

### Important Notes

1. **Service Account Authentication for GCS**:
   - You can't use HMAC authentication to authenticate GCS
   - Use service account authentication instead
   - Set `GCP_SERVICE_ACCOUNT_KEY_JSON_PATH`, or `GCP_CLIENT_EMAIL` and `GCP_PRIVATE_KEY`

2. **Timezone Settings**:
   - Default timezone of weseek/mariadb-awesome-backup is "Asia/Tokyo"
   - Default timezone of awesome-mariadb-backup is not set (UTC)
   - Set the `TZ` environment variable to change timezone

## Related Projects

- [awesome-mongodb-backup](../awesome-mongodb-backup/README.md)
- [awesome-postgresql-backup](../awesome-postgresql-backup/README.md)
- [awesome-mariadb-backup](../awesome-mariadb-backup/README.md)
- [awesome-file-backup](../awesome-file-backup/README.md)

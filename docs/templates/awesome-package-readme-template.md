# What is [AWESOME_PACKAGE_NAME]

[PACKAGE_DESCRIPTION]

## Key Features

- [FEATURE_1]
- [FEATURE_2]
- [FEATURE_3]
- [FEATURE_4]

## Installation

### Using npm

```bash
npm install @awesome-database-backup/[PACKAGE_NAME]
```

### Using Docker

```bash
docker pull weseek/[PACKAGE_NAME]
```

## Usage

See "README.md" for each command or run command with "--help" option.

- [[BACKUP_COMMAND]](../[BACKUP_COMMAND_PATH]/README.md)
- [[RESTORE_COMMAND]](../[RESTORE_COMMAND_PATH]/README.md)
- [list](../list/README.md)
- [prune](../prune/README.md)

### With Docker Image

Backed up file names will be time-stamped. (ex. `backup-20220611170158.bz2`)

```bash
[DOCKER_EXAMPLE]
```

#### Environment Variables

| Variable | Description |
|----------|-------------|
| `TARGET_BUCKET_URL` | Target Bucket URL ([s3://...\|gs://...]) |
| `AWS_REGION` | AWS Region |
| `AWS_ACCESS_KEY_ID` | Your IAM Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | Your IAM Secret Access Key |
| `AWS_ENDPOINT_URL` | URL to send the request to (for S3-compatible services) |
| `GCP_PROJECT_ID` | GCP Project ID |
| `GCP_SERVICE_ACCOUNT_KEY_JSON_PATH` | JSON file path to your GCP Service Account Key |
| `BACKUP_TOOL_OPTIONS` | Options to pass to the backup tool |
| `RESTORE_TOOL_OPTIONS` | Options to pass to the restore tool |
| `TZ` | Timezone for timestamps (default: UTC) |

#### Docker Compose Example

```yaml
[DOCKER_COMPOSE_EXAMPLE]
```

## Timezone Settings

Timezone is not set as default so time-stamp show UTC.
If you want to change it, set the `TZ` environment variable. (see. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## Migration from Previous Versions

[MIGRATION_SECTION]

## Related Projects

- [awesome-mongodb-backup](../awesome-mongodb-backup/README.md)
- [awesome-postgresql-backup](../awesome-postgresql-backup/README.md)
- [awesome-mariadb-backup](../awesome-mariadb-backup/README.md)
- [awesome-file-backup](../awesome-file-backup/README.md)

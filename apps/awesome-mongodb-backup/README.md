# What is awesome-mongodb-backup

Collection of CLI executable npm packages which backup MongoDB databases to Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Key Features

- Backup and restore for MongoDB databases
- Support for major cloud storage services (S3, GCS)
- Streaming mode for efficient large data transfers
- Cron scheduling for automated backups
- Docker support for containerized environments

## Installation

```bash
docker pull weseek/awesome-mongodb-backup
```

## Usage

See "README.md" for each command or run command with "--help" option.

- [mongodb-backup](../mongodb-backup/README.md)
- [mongodb-restore](../mongodb-restore/README.md)
- [list](../list/README.md)
- [prune](../prune/README.md)

### With Docker Image

Backed up file names will be time-stamped. (ex. `backup-20220611170158.gz`)

```bash
# Run MongoDB backup
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/ \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  -e BACKUP_TOOL_OPTIONS="mongodb+srv://root:password@mongo/db?readPreference=secondary&ssl=false&authSource=admin" \
  weseek/awesome-mongodb-backup backup

# Restore from backup
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/backup-20220611170158.gz \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  -e RESTORE_TOOL_OPTIONS="mongodb+srv://root:password@mongo/db?ssl=false&authSource=admin" \
  weseek/awesome-mongodb-backup restore

# List backup files
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/ \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  weseek/awesome-mongodb-backup list

# Delete old backup files
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/ \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  weseek/awesome-mongodb-backup prune
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
| `BACKUP_TOOL_OPTIONS` | Options to pass to mongodump command (e.g., "mongodb+srv://root:password@mongo/db") |
| `RESTORE_TOOL_OPTIONS` | Options to pass to mongorestore command (e.g., "mongodb+srv://root:password@mongo/db") |
| `BACKUPFILE_PREFIX` | Prefix of backup file (default: "backup") |
| `CRON_EXPRESSION` | Cron expression for scheduled backups (e.g., "0 4 * * *" for daily at 4:00 AM) |
| `HEALTHCHECK_URL` | URL that gets called after a successful backup (e.g., https://healthchecks.io) |
| `USE_STREAM` | Set to "true" to use streaming mode for backup (no temporary files) |
| `TZ` | Timezone for timestamps (default: UTC) |

#### Docker Compose Example

```yaml
version: '3'
services:
  mongodb:
    image: mongo:latest
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=password
      - MONGO_INITDB_DATABASE=mydb
    volumes:
      - mongodb_data:/data/db

  backup:
    image: weseek/awesome-mongodb-backup
    command: backup
    environment:
      - TARGET_BUCKET_URL=s3://my-bucket/backups/
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=your-access-key
      - AWS_SECRET_ACCESS_KEY=your-secret-key
      - BACKUP_TOOL_OPTIONS=mongodb+srv://root:password@mongodb/mydb?readPreference=secondary&ssl=false&authSource=admin
      - TZ=Asia/Tokyo
    depends_on:
      - mongodb
    restart: no

volumes:
  mongodb_data:
```

#### Kubernetes Example

```yaml
# Create a Kubernetes service account
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backup-service-account
  namespace: default
---
# Create a CronJob that uses the service account
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mongodb-backup-job
  namespace: default
spec:
  schedule: "0 2 * * *"  # Run at 2 AM every day
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: backup-service-account
          containers:
          - name: backup
            image: weseek/awesome-mongodb-backup
            env:
            - name: TARGET_BUCKET_URL
              value: s3://my-bucket/backups/
            - name: AWS_REGION
              value: us-east-1
            - name: AWS_ROLE_ARN
              value: "arn:aws:iam::123456789012:role/my-backup-role"
            - name: AWS_WEB_IDENTITY_TOKEN_FILE
              value: "/var/run/secrets/tokens/aws-token"
            - name: BACKUP_TOOL_OPTIONS
              value: --uri mongodb://mongo:27017/mydb
            volumeMounts:
            - name: token-volume
              mountPath: /var/run/secrets/tokens
          volumes:
          - name: token-volume
            projected:
              sources:
              - serviceAccountToken:
                  path: aws-token
          restartPolicy: OnFailure
```

## Timezone Settings

Timezone is not set as default so time-stamp show UTC.
If you want to change it, set the `TZ` environment variable. (see. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## Migration from Previous Versions

If you are migrating from [weseek/mongodb-awesome-backup](https://github.com/weseek/mongodb-awesome-backup), you need to change the following environment variables:

| weseek/mongodb-awesome-backup | awesome-mongodb-backup |
| ----------------------------- | ---------------------- |
| `AWSCLI_ENDPOINT_OPT` | `AWS_ENDPOINT_URL` |
| `MONGODB_URI` | `BACKUP_TOOL_OPTIONS` / `RESTORE_TOOL_OPTIONS` |
| `MONGODB_HOST` | `BACKUP_TOOL_OPTIONS` / `RESTORE_TOOL_OPTIONS` |
| `MONGODB_DBNAME` | `BACKUP_TOOL_OPTIONS` / `RESTORE_TOOL_OPTIONS` |
| `MONGODB_USERNAME` | `BACKUP_TOOL_OPTIONS` / `RESTORE_TOOL_OPTIONS` |
| `MONGODB_PASSWORD` | `BACKUP_TOOL_OPTIONS` / `RESTORE_TOOL_OPTIONS` |
| `MONGODB_AUTHDB` | `BACKUP_TOOL_OPTIONS` / `RESTORE_TOOL_OPTIONS` |
| `CRONMODE` | - **NO SETTINGS REQUIRED** (Only `CRON_EXPRESSION` needs to be set) |
| `AWSCLIOPT` | - **DISABLED** |
| `GCSCLIOPT` | - **DISABLED** |

For more details, see:
- [mongodb-backup](../mongodb-backup/README.md)
- [mongodb-restore](../mongodb-restore/README.md)

### Important Notes

1. **Service Account Authentication for GCS**:
   - You can't use HMAC authentication to authenticate GCS
   - Use service account authentication instead
   - Set `GCP_SERVICE_ACCOUNT_KEY_JSON_PATH`, or `GCP_CLIENT_EMAIL` and `GCP_PRIVATE_KEY`

2. **Timezone Settings**:
   - Default timezone of weseek/mongodb-awesome-backup is "Asia/Tokyo"
   - Default timezone of awesome-mongodb-backup is not set (UTC)
   - Set the `TZ` environment variable to change timezone

## Related Projects

- [awesome-mongodb-backup](../awesome-mongodb-backup/README.md)
- [awesome-postgresql-backup](../awesome-postgresql-backup/README.md)
- [awesome-mariadb-backup](../awesome-mariadb-backup/README.md)
- [awesome-file-backup](../awesome-file-backup/README.md)

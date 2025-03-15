# What is awesome-postgresql-backup

Collection of CLI executable npm packages which backup PostgreSQL databases to Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Key Features

- Backup and restore for PostgreSQL databases
- Support for major cloud storage services (S3, GCS)
- Streaming mode for efficient large data transfers
- Cron scheduling for automated backups
- Docker support for containerized environments

## Installation

```bash
docker pull weseek/awesome-postgresql-backup
```

## Usage

See "README.md" for each command or run command with "--help" option.

- [postgresql-backup](../postgresql-backup/README.md)
- [postgresql-restore](../postgresql-restore/README.md)
- [list](../list/README.md)
- [prune](../prune/README.md)

### With Docker Image

Backed up file names will be time-stamped. (ex. `backup-20220611170158.gz`)

```bash
# Run PostgreSQL backup
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/ \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  -e BACKUP_TOOL_OPTIONS="--host postgres --username postgres --dbname mydb" \
  -e PGPASSWORD=password \
  weseek/awesome-postgresql-backup backup

# Restore from backup
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/backup-20220611170158.gz \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  -e RESTORE_TOOL_OPTIONS="--host postgres --username postgres --dbname mydb" \
  -e PGPASSWORD=password \
  weseek/awesome-postgresql-backup restore

# List backup files
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/ \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  weseek/awesome-postgresql-backup list

# Delete old backup files
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/ \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  weseek/awesome-postgresql-backup prune
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
| `BACKUP_TOOL_OPTIONS` | Options to pass to pg_dump command (e.g., "--host postgres --username postgres --dbname mydb") |
| `RESTORE_TOOL_OPTIONS` | Options to pass to pg_restore command (e.g., "--host postgres --username postgres --dbname mydb") |
| `PGPASSWORD` | PostgreSQL password (alternative to specifying password in BACKUP/RESTORE_TOOL_OPTIONS) |
| `BACKUPFILE_PREFIX` | Prefix of backup file (default: "backup") |
| `CRON_EXPRESSION` | Cron expression for scheduled backups (e.g., "0 4 * * *" for daily at 4:00 AM) |
| `HEALTHCHECK_URL` | URL that gets called after a successful backup (e.g., https://healthchecks.io) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to JSON credentials configuration file of Application Default Credentials(ADC) for your external identity |
| `USE_STREAM` | Set to "true" to use streaming mode for backup (no temporary files) |
| `TZ` | Timezone for timestamps (default: UTC) |

#### Docker Compose Example

```yaml
version: '3'
services:
  postgres:
    image: postgres:latest
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backup:
    image: weseek/awesome-postgresql-backup
    command: backup
    environment:
      - TARGET_BUCKET_URL=s3://my-bucket/backups/
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=your-access-key
      - AWS_SECRET_ACCESS_KEY=your-secret-key
      - BACKUP_TOOL_OPTIONS=--host postgres --username postgres --dbname mydb
      - PGPASSWORD=password
      - TZ=Asia/Tokyo
    depends_on:
      - postgres
    restart: no

volumes:
  postgres_data:
```

#### Kubernetes Example (Use S3)

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
  name: postgresql-backup-job
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
            image: weseek/awesome-postgresql-backup
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
              value: --host postgres --username postgres --dbname mydb
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

#### Kubernetes Example (Use GCS)

Prerequisite:

- Prepare IAM users with read/write permissions to GCS with WorkloadIdentityFederation
  - https://cloud.google.com/iam/docs/workload-identity-federation

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
  name: file-backup-job
  namespace: default
spec:
  schedule: "0 2 * * *"  # Run at 2 AM every day
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: backup-service-account
          initContainers:
          - name: issue-token
            image: gcr.io/google.com/cloudsdktool/google-cloud-cli:stable
            command:
            - sh
            - -c
            - |
              gcloud iam workload-identity-pools create-cred-config \
                projects/123456789012/locations/global/workloadIdentityPools/my-pool-name/providers/my-provider-name \
                --output-file=/var/run/secrets/gcloud/config/federation.json \
                --credential-source-file=/var/run/secrets/tokens/gcs-token
              gcloud auth login --cred-file=/var/run/secrets/gcloud/config/federation.json
            volumeMounts:
            - name: token-volume
              mountPath: /var/run/secrets/tokens
            - name: gcloud-config
              mountPath: /var/run/secrets/gcloud/config
          containers:
          - name: backup
            image: weseek/awesome-file-backup
            env:
            - name: TARGET_BUCKET_URL
              value: gcs://my-bucket/backups/
            - name: GCP_PROJECT_ID
              value: gcs-temp
            - name: GOOGLE_APPLICATION_CREDENTIALS
              value: /var/run/secrets/gcloud/config/federation.json
            - name: BACKUP_TOOL_OPTIONS
              value: -v /data
            volumeMounts:
              - name: token-volume
                mountPath: /var/run/secrets/tokens
              - name: gcloud-config
                mountPath: /var/run/secrets/gcloud/config
          volumes:
          - name: token-volume
            projected:
              sources:
                - serviceAccountToken:
                    path: gcs-token
          - name: gcloud-config
            emptyDir: {}
          restartPolicy: OnFailure
```

## Timezone Settings

Timezone is not set as default so time-stamp show UTC.
If you want to change it, set the `TZ` environment variable. (see. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## Related Projects

- [awesome-mongodb-backup](../awesome-mongodb-backup/README.md)
- [awesome-postgresql-backup](../awesome-postgresql-backup/README.md)
- [awesome-mariadb-backup](../awesome-mariadb-backup/README.md)
- [awesome-file-backup](../awesome-file-backup/README.md)

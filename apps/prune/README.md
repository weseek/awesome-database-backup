# prune

Prune backuped files from Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Features

- Delete old backup files from cloud storage (S3, GCS)
- Support for S3-compatible services (DigitalOcean Spaces, etc.)
- Configurable retention policy
- Automatic cleanup based on file age

## Usage

### Basic Usage

```bash
prune --target-bucket-url s3://my-bucket/backups/ \
  --aws-region us-east-1 \
  --aws-access-key-id YOUR_ACCESS_KEY_ID \
  --aws-secret-access-key YOUR_SECRET_ACCESS_KEY
```

### Options

```
Usage: prune [options]

Options:
  -V, --version                                                            output the version number
  --target-bucket-url <TARGET_BUCKET_URL> **MANDATORY**                    Target Bucket URL ([s3://...|gs://...]) (env: TARGET_BUCKET_URL)
  --aws-endpoint-url <AWS_ENDPOINT_URL>                                    URL to send the request to (env: AWS_ENDPOINT_URL)
  --aws-region <AWS_REGION>                                                AWS Region (env: AWS_REGION)
  --aws-access-key-id <AWS_ACCESS_KEY_ID>                                  Your IAM Access Key ID (env: AWS_ACCESS_KEY_ID)
  --aws-secret-access-key <AWS_SECRET_ACCESS_KEY>                          Your IAM Secret Access Key (env: AWS_SECRET_ACCESS_KEY)
  --gcp-endpoint-url <GCP_ENDPOINT_URL>                                    URL to send the request to (env: GCP_ENDPOINT_URL)
  --gcp-project-id <GCP_PROJECT_ID>                                        GCP Project ID (env: GCP_PROJECT_ID)
  --gcp-private-key <GCP_PRIVATE_KEY>                                      GCP Private Key (env: GCP_PRIVATE_KEY)
  --gcp-client-email <GCP_CLIENT_EMAIL>                                    GCP Client Email (env: GCP_CLIENT_EMAIL)
  --gcp-service-account-key-json-path <GCP_SERVICE_ACCOUNT_KEY_JSON_PATH>  JSON file path to your GCP Service Account Key (env: GCP_SERVICE_ACCOUNT_KEY_JSON_PATH)
  --backupfile-prefix <BACKUPFILE_PREFIX>                                  Prefix of backup file. (default: "backup", env: BACKUPFILE_PREFIX)
  --delete-divide <DELETE_DIVIDE>                                          delete divide (default: 3, env: DELETE_DIVIDE)
  --delete-target-days-left <DELETE_TARGET_DAYS_LEFT>                      How many days ago to be deleted (default: 4, env: DELETE_TARGET_DAYS_LEFT)
  -h, --help                                                               display help for command
```

### Examples

#### Prune Files from Amazon S3

```bash
prune --target-bucket-url s3://my-bucket/backups/ \
  --aws-region us-east-1 \
  --aws-access-key-id YOUR_ACCESS_KEY_ID \
  --aws-secret-access-key YOUR_SECRET_ACCESS_KEY
```

#### Prune Files from Google Cloud Storage

```bash
prune --target-bucket-url gs://my-bucket/backups/ \
  --gcp-project-id your-project-id \
  --gcp-service-account-key-json-path /path/to/service-account-key.json
```

#### Using Environment Variables

```bash
export TARGET_BUCKET_URL=s3://my-bucket/backups/
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY

prune
```

#### Customizing Retention Policy

```bash
# Keep more recent backups
prune --target-bucket-url s3://my-bucket/backups/ \
  --aws-region us-east-1 \
  --aws-access-key-id YOUR_ACCESS_KEY_ID \
  --aws-secret-access-key YOUR_SECRET_ACCESS_KEY \
  --delete-divide 5 \
  --delete-target-days-left 7

# Only delete very old backups
prune --target-bucket-url s3://my-bucket/backups/ \
  --aws-region us-east-1 \
  --aws-access-key-id YOUR_ACCESS_KEY_ID \
  --aws-secret-access-key YOUR_SECRET_ACCESS_KEY \
  --delete-target-days-left 30
```

## Retention Policy

The prune command uses a retention policy to determine which backup files to delete:

- `--delete-divide`: Divides the backup files into groups. Default is 3, meaning it keeps 1/3 of the files and deletes 2/3.
- `--delete-target-days-left`: Only considers files older than this many days. Default is 4, meaning it only deletes files that are at least 4 days old.

For example, with the default settings:
- Files less than 4 days old are always kept
- Of the files 4+ days old, 1/3 are kept and 2/3 are deleted

This approach ensures you keep more recent backups while still maintaining some historical backups.

## Authentication

### Amazon S3 Authentication

You can authenticate with Amazon S3 using one of the following methods:

1. **Environment Variables**:
   - `AWS_REGION`: AWS Region
   - `AWS_ACCESS_KEY_ID`: Your IAM Access Key ID
   - `AWS_SECRET_ACCESS_KEY`: Your IAM Secret Access Key
   - `AWS_ENDPOINT_URL`: URL to send the request to (for S3-compatible services)

2. **Command Line Options**:
   - `--aws-region`: AWS Region
   - `--aws-access-key-id`: Your IAM Access Key ID
   - `--aws-secret-access-key`: Your IAM Secret Access Key
   - `--aws-endpoint-url`: URL to send the request to (for S3-compatible services)

3. **AWS STS with Web Identity Federation** (for Kubernetes environments):
   - `AWS_ROLE_ARN`: ARN of the role to assume
   - `AWS_WEB_IDENTITY_TOKEN_FILE`: Path to the web identity token file

The authentication process uses the AWS SDK's credential provider chain, which looks for credentials in the following order:
1. Environment variables
2. Shared credentials file (~/.aws/credentials)
3. ECS container credentials
4. EC2 instance profile credentials
5. Web Identity Token credentials

### Google Cloud Storage Authentication

You can authenticate with Google Cloud Storage using one of the following methods:

1. **Environment Variables**:
   - `GCP_PROJECT_ID`: GCP Project ID
   - `GCP_SERVICE_ACCOUNT_KEY_JSON_PATH`: JSON file path to your GCP Service Account Key
   - `GCP_CLIENT_EMAIL`: GCP Client Email
   - `GCP_PRIVATE_KEY`: GCP Private Key
   - `GCP_ENDPOINT_URL`: URL to send the request to for GCP
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to JSON credentials configuration file of Application Default Credentials(ADC) for your external identity

2. **Command Line Options**:
   - `--gcp-project-id`: GCP Project ID
   - `--gcp-service-account-key-json-path`: JSON file path to your GCP Service Account Key
   - `--gcp-client-email`: GCP Client Email
   - `--gcp-private-key`: GCP Private Key
   - `--gcp-endpoint-url`: URL to send the request to for GCP

**Important Note**: You can't use HMAC authentication to authenticate GCS. Use service account authentication instead by setting `GCP_SERVICE_ACCOUNT_KEY_JSON_PATH`, or `GCP_CLIENT_EMAIL` and `GCP_PRIVATE_KEY`.

## Related Commands

- [file-backup](../file-backup/README.md) - Backup file system data to cloud storage
- [file-restore](../file-restore/README.md) - Restore file system data from backup
- [list](../list/README.md) - List backup files

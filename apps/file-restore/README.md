# file-restore

Restore data stored in a file system from backuped file on Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Features

- Restore file system data from cloud storage (S3, GCS)
- Support for S3-compatible services (DigitalOcean Spaces, etc.)
- Support for various compression formats (.gz, .bz2, .tar)
- Flexible restore options for different target locations

## Usage

### Basic Usage

```bash
restore --target-bucket-url s3://my-bucket/backups/backup-20220611170158.tar.gz \
  --aws-region us-east-1 \
  --aws-access-key-id YOUR_ACCESS_KEY_ID \
  --aws-secret-access-key YOUR_SECRET_ACCESS_KEY \
  --restore-tool-options "-C /path/to/restore"
```

### Options

```
Usage: restore [options]

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
  --restore-tool-options <OPTIONS_STRING>                                  pass options to restore tool exec (env: RESTORE_TOOL_OPTIONS)
  -h, --help                                                               display help for command

TIPS:
  You can omit entering the DB password by setting it as an environment variable like this: `export MYSQL_PWD="password"      

NOTICE:
  You can pass tar options by set "--restore-tool-options". (ex. "-C /path/to/restore")
```

### Examples

#### Restore from Amazon S3

```bash
restore --target-bucket-url s3://my-bucket/backups/backup-20220611170158.tar.gz \
  --aws-region us-east-1 \
  --aws-access-key-id YOUR_ACCESS_KEY_ID \
  --aws-secret-access-key YOUR_SECRET_ACCESS_KEY \
  --restore-tool-options "-C /path/to/restore"
```

#### Restore from Google Cloud Storage

```bash
restore --target-bucket-url gs://my-bucket/backups/backup-20220611170158.tar.gz \
  --gcp-project-id your-project-id \
  --gcp-service-account-key-json-path /path/to/service-account-key.json \
  --restore-tool-options "-C /path/to/restore"
```

#### Using Environment Variables

```bash
export TARGET_BUCKET_URL=s3://my-bucket/backups/backup-20220611170158.tar.gz
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
export RESTORE_TOOL_OPTIONS="-C /path/to/restore"

restore
```

#### Specifying Restore Options

```bash
# Restore to a specific directory
restore --target-bucket-url s3://my-bucket/backups/backup-20220611170158.tar.gz \
  --aws-region us-east-1 \
  --aws-access-key-id YOUR_ACCESS_KEY_ID \
  --aws-secret-access-key YOUR_SECRET_ACCESS_KEY \
  --restore-tool-options "-C /path/to/restore"

# Restore with verbose output
restore --target-bucket-url s3://my-bucket/backups/backup-20220611170158.tar.gz \
  --aws-region us-east-1 \
  --aws-access-key-id YOUR_ACCESS_KEY_ID \
  --aws-secret-access-key YOUR_SECRET_ACCESS_KEY \
  --restore-tool-options "-C /path/to/restore -v"
```

## Authentication

### For Amazon S3

- Set `AWS_REGION` and `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- For S3-compatible services, also set `AWS_ENDPOINT_URL`

### For Google Cloud Storage

- Set `GCP_SERVICE_ACCOUNT_KEY_JSON_PATH` and `GCP_PROJECT_ID`, or
- Set `GCP_CLIENT_EMAIL` and `GCP_PRIVATE_KEY` and `GCP_PROJECT_ID`

For details, see [service account authentication](https://cloud.google.com/docs/authentication/production).

**Note**: You can't use HMAC authentication to authenticate GCS. (https://github.com/googleapis/nodejs-storage/issues/117)

## Related Commands

- [file-backup](../file-backup/README.md) - Backup file system data to cloud storage
- [list](../list/README.md) - List backup files
- [prune](../prune/README.md) - Delete old backup files

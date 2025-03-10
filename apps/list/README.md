# list

List files from Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Features

- List files from cloud storage (S3, GCS)
- Support for S3-compatible services (DigitalOcean Spaces, etc.)
- Detailed file information including name, date, and size

## Usage

### Basic Usage

```bash
list --target-bucket-url s3://my-bucket/backups/ \
  --aws-region us-east-1 \
  --aws-access-key-id YOUR_ACCESS_KEY_ID \
  --aws-secret-access-key YOUR_SECRET_ACCESS_KEY
```

### Options

```
Usage: list [options]

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
  -h, --help                                                               display help for command
```

### Examples

#### List Files from Amazon S3

```bash
list --target-bucket-url s3://my-bucket/backups/ \
  --aws-region us-east-1 \
  --aws-access-key-id YOUR_ACCESS_KEY_ID \
  --aws-secret-access-key YOUR_SECRET_ACCESS_KEY
```

#### List Files from Google Cloud Storage

```bash
list --target-bucket-url gs://my-bucket/backups/ \
  --gcp-project-id your-project-id \
  --gcp-service-account-key-json-path /path/to/service-account-key.json
```

#### Using Environment Variables

```bash
export TARGET_BUCKET_URL=s3://my-bucket/backups/
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY

list
```

## Output Format

The command outputs a list of files in the specified bucket path. Each line contains:
- File name
- Last modified date
- File size

Example output:
```
backup-20220610170158.tar.gz  2022-06-10 17:01:58  15.2 MB
backup-20220611170158.tar.gz  2022-06-11 17:01:58  15.5 MB
backup-20220612170158.tar.gz  2022-06-12 17:01:58  15.3 MB
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
- [file-restore](../file-restore/README.md) - Restore file system data from backup
- [prune](../prune/README.md) - Delete old backup files

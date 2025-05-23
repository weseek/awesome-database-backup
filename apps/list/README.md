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
- [prune](../prune/README.md) - Delete old backup files

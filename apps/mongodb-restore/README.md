# mongodb-restore

Restore MongoDB database from backuped file on Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Usage

### How to restore

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

NOTICE:
  You can pass mongoDB options by set "--restore-tool-options". (ex. "--host db.example.com --username admin")
```

## Authenticate storage service

S3 or GCS authentication is required depending on the storage service used.

- For S3
  - Set `AWS_REGION` and `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- For GCS
  - To use [service account authentication](https://cloud.google.com/docs/authentication/production), create JSON Web Key and set `GCP_SERVICE_JSON_PATH` and `GCP_PROJECT_ID`
  - To use [HMAC authentication](https://cloud.google.com/storage/docs/authentication/hmackeys), set `GCP_ACCESS_KEY_ID`, `GCP_SECRET_ACCESS_KEY`, and `GCP_PROJECT_ID`

# Migrate from [weseek/mongodb-awesome-backup](https://github.com/weseek/mongodb-awesome-backup)

Change the following environment variables.

| weseek/mongodb-awesome-backup | mongodb-restore |
| ----------------------------- | -------------- |
| `AWSCLI_ENDPOINT_OPT` | `AWS_ENDPOINT_URL` |
| `GCP_ACCESS_KEY_ID` | `GCP_CLIENT_EMAIL` |
| `GCP_SECRET_ACCESS_KEY` | `GCP_PRIVATE_KEY` |
| `MONGODB_URI` | `RESTORE_TOOL_OPTIONS` |
| `MONGODB_HOST` | `RESTORE_TOOL_OPTIONS` |
| `MONGODB_DBNAME` | `RESTORE_TOOL_OPTIONS` |
| `MONGODB_USERNAME` | `RESTORE_TOOL_OPTIONS` |
| `MONGODB_PASSWORD` | `RESTORE_TOOL_OPTIONS` |
| `MONGODB_AUTHDB` | `RESTORE_TOOL_OPTIONS` |
| `AWSCLIOPT` | - **DISABLED** |
| `GCSCLIOPT` | - **DISABLED** |

### Set proper timezone

If you use weseek/mongodb-awesome-backup with docker image, note that the default timezone of the docker image is different.

- Default timezone of weseek/mongodb-awesome-backup is "Asia/Tokyo"
- Default timezone of awesome-mongodb-backup is not set

You can set the `TZ` environment variable to change timezone. (see. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

### Set proper `BACKUP_TOOL_OPTIONS`

awesome-mongodb-backup specifies all the information needed to dump the database data,
including the information to connect to the database, in `BACKUP_TOOL_OPTIONS`.

Below is an example of migration.

From weseek/mongodb-awesome-backup...

| Environment | Value |
| ----------------------------- | --- |
| `TARGET_BUCKET_URL` | s3://some-bucket-name/backup-20220611170158.gz |
| `MONGODB_URI` | mongodb+srv://root:password@mongo/db?ssl=false&authSource=admin |

To awesome-mongodb-backup...

| Environment | Value |
| ----------------------------- | --- |
| `TARGET_BUCKET_URL` | s3://some-bucket-name/backup-20220611170158.gz |
| `BACKUP_TOOL_OPTIONS` | mongodb+srv://root:password@mongo/db?ssl=false&authSource=admin |

# mongodb-backup

Backup MongoDB database and store to Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Usage

### How to backup

```
Usage: backup [options]

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
  --cronmode <CRON_EXPRESSION>                                             Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically.(ex. CRON_EXPRESSION="0 4 * * *" if you want to run at 4:00 every day) (env: CRON_EXPRESSION)
  --healthcheck-url <HEALTHCHECK_URL>                                      URL that gets called after a successful backup (eg. https://healthchecks.io) (env: HEALTHCHECKS_URL)
  --backup-tool-options <OPTIONS_STRING>                                   pass options to backup tool exec (ex. "--host db.example.com --username admin") (env: BACKUP_TOOL_OPTIONS)
  -h, --help                                                               display help for command

NOTICE:
  You can pass mongoDB options by set "--backup-tool-options". (ex. "--host db.example.com --username admin")
```

## Authenticate storage service

S3 or GCS authentication is required depending on the storage service used.

- For S3
  - Set `AWS_REGION` and `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- For GCS(*)
  - Set `GCP_SERVICE_JSON_PATH`, or `GCP_CLIENT_EMAIL` and `GCP_PRIVATE_KEY`.  
    For detail, see [service account authentication](https://cloud.google.com/docs/authentication/production).

(*) You can't use HMAC authentication to authenticate GCS. (https://github.com/googleapis/nodejs-storage/issues/117)

# Migrate from [weseek/mongodb-awesome-backup](https://github.com/weseek/mongodb-awesome-backup)

Change the following environment variables.

| weseek/mongodb-awesome-backup | mongodb-backup |
| ----------------------------- | -------------- |
| `AWSCLI_ENDPOINT_OPT` | `AWS_ENDPOINT_URL` |
| `MONGODB_URI` | `BACKUP_TOOL_OPTIONS` |
| `MONGODB_HOST` | `BACKUP_TOOL_OPTIONS` |
| `MONGODB_DBNAME` | `BACKUP_TOOL_OPTIONS` |
| `MONGODB_USERNAME` | `BACKUP_TOOL_OPTIONS` |
| `MONGODB_PASSWORD` | `BACKUP_TOOL_OPTIONS` |
| `MONGODB_AUTHDB` | `BACKUP_TOOL_OPTIONS` |
| `CRONMODE` | - **NO SETTINGS REQURIED** (Only `CRON_EXPRESSION` needs to be set) |
| `AWSCLIOPT` | - **DISABLED** |
| `GCSCLIOPT` | - **DISABLED** |

### Use service account authentication

You can't use HMAC authentication to authenticate GCS. (https://github.com/googleapis/nodejs-storage/issues/117)

So, you need to use [service account authentication](https://cloud.google.com/docs/authentication/production).
Set `GCP_SERVICE_JSON_PATH`, or `GCP_CLIENT_EMAIL` and `GCP_PRIVATE_KEY`.

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
| `TARGET_BUCKET_URL` | s3://some-bucket-name/ |
| `MONGODB_URI` | mongodb+srv://root:password@mongo/db?readPreference=secondary&ssl=false&authSource=admin |
| `CRONMODE` | true |
| `CRON_EXPRESSION` | "0 4 * * *" |

To awesome-mongodb-backup...

| Environment | Value |
| ----------------------------- | --- |
| `TARGET_BUCKET_URL` | s3://some-bucket-name/ |
| `BACKUP_TOOL_OPTIONS` | mongodb+srv://root:password@mongo/db?readPreference=secondary&ssl=false&authSource=admin |
| `CRON_EXPRESSION` | "0 4 * * *" |

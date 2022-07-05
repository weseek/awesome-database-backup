# mariadb-backup

Backup MariaDB database and store to Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

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
  --backup-tool-options <OPTIONS_STRING>                                   pass options to backup tool exec (ex. "--host db.example.com --user root") (env: BACKUP_TOOL_OPTIONS)
  -h, --help                                                               display help for command

NOTICE:
  You can pass MariaDB options by set "--backup-tool-options". (ex. "--host db.example.com --user root")
```

## Authenticate storage service

S3 or GCS authentication is required depending on the storage service used.

- For S3
  - Set `AWS_REGION` and `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- For GCS
  - To use [service account authentication](https://cloud.google.com/docs/authentication/production), create JSON Web Key and set `GCP_SERVICE_JSON_PATH` and `GCP_PROJECT_ID`
  - To use [HMAC authentication](https://cloud.google.com/storage/docs/authentication/hmackeys), set `GCP_ACCESS_KEY_ID`, `GCP_SECRET_ACCESS_KEY`, and `GCP_PROJECT_ID`

## Migrate from [weseek/mariadb-awesome-backup](https://github.com/weseek/mariadb-awesome-backup)

Change the following environment variables.

| weseek/mariadb-awesome-backup | mariadb-backup |
| ----------------------------- | -------------- |
| `GCP_ACCESS_KEY_ID` | `GCP_CLIENT_EMAIL` |
| `GCP_SECRET_ACCESS_KEY` | `GCP_PRIVATE_KEY` |
| `MARIADB_HOST` | `BACKUP_TOOL_OPTIONS` |
| `MARIADB_DBNAME` | `BACKUP_TOOL_OPTIONS` |
| `MARIADB_USERNAME` | `BACKUP_TOOL_OPTIONS` |
| `MARIADB_PASSWORD` | `BACKUP_TOOL_OPTIONS` or `MYSQL_PWD` |
| `MYSQLDUMP_OPTS` | `BACKUP_TOOL_OPTIONS` |

### Set proper timezone

If you use weseek/mariadb-awesome-backup with docker image, note that the default timezone of the docker image is different.

- Default timezone of weseek/mariadb-awesome-backup is "Asia/Tokyo"
- Default timezone of awesome-mariadb-backup is not set

You can set the `TZ` environment variable to change timezone. (see. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

### Set proper `BACKUP_TOOL_OPTIONS`

awesome-mariadb-backup specifies all the information needed to dump the database data,
including the information to connect to the database, in `BACKUP_TOOL_OPTIONS`.

Below is an example of migration.

From weseek/mariadb-awesome-backup...

| Environment | Value |
| ----------------------------- | --- |
| `TARGET_BUCKET_URL` | s3://some-bucket-name/ |
| `MARIADB_HOST` | mariadb |
| `MARIADB_USERNAME` | root |
| `MARIADB_PASSWORD` | password |

To awesome-mariadb-backup...

| Environment | Value |
| ----------------------------- | --- |
| `TARGET_BUCKET_URL` | s3://some-bucket-name/ |
| `BACKUP_TOOL_OPTIONS` | --host mariadb --user root --all-databases |
| `MYSQL_PWD` | password |

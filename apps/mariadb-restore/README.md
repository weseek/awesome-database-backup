# mariadb-restore

Restore MariaDB database from backuped file on Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

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

TIPS:
  You can omit entering the DB password by setting it as an environment variable like this: `export MYSQL_PWD="password"      

NOTICE:
  You can pass MariaDB options by set "--restore-tool-options". (ex. "--host db.example.com --user root")
```

## Authenticate storage service

S3 or GCS authentication is required depending on the storage service used.

- For S3
  - Set `AWS_REGION` and `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- For GCS(*)
  - Set `GCP_SERVICE_JSON_PATH`, or `GCP_CLIENT_EMAIL` and `GCP_PRIVATE_KEY`.  
    For detail, see [service account authentication](https://cloud.google.com/docs/authentication/production).

(*) You can't use HMAC authentication to authenticate GCS. (https://github.com/googleapis/nodejs-storage/issues/117)

## Migrate from [weseek/mariadb-awesome-backup](https://github.com/weseek/mariadb-awesome-backup)

Change the following environment variables.

| weseek/mariadb-awesome-backup | mariadb-restore |
| ----------------------------- | -------------- |
| `MARIADB_HOST` | `RESTORE_TOOL_OPTIONS` |
| `MARIADB_DBNAME` | `RESTORE_TOOL_OPTIONS` |
| `MARIADB_USERNAME` | `RESTORE_TOOL_OPTIONS` |
| `MARIADB_PASSWORD` | `RESTORE_TOOL_OPTIONS` or `MYSQL_PWD` |
| `MYSQL_OPTS` | `RESTORE_TOOL_OPTIONS` |

### Use service account authentication

You can't use HMAC authentication to authenticate GCS. (https://github.com/googleapis/nodejs-storage/issues/117)

So, you need to use [service account authentication](https://cloud.google.com/docs/authentication/production).
Set `GCP_SERVICE_JSON_PATH`, or `GCP_CLIENT_EMAIL` and `GCP_PRIVATE_KEY`.

### Set proper timezone

If you use weseek/mariadb-awesome-backup with docker image, note that the default timezone of the docker image is different.

- Default timezone of weseek/mariadb-awesome-backup is "Asia/Tokyo"
- Default timezone of awesome-mariadb-backup is not set

You can set the `TZ` environment variable to change timezone. (see. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

### Set proper `RESTORE_TOOL_OPTIONS`

awesome-mariadb-backup specifies all the information needed to restore the database data,
including the information to connect to the database, in `RESTORE_TOOL_OPTIONS`.

Below is an example of migration.

From weseek/mariadb-awesome-backup...

| Environment | Value |
| ----------------------------- | --- |
| `TARGET_BUCKET_URL` | s3://some-bucket-name/backup-20220611170158.bz2 |
| `MARIADB_HOST` | mariadb |
| `MARIADB_DBNAME` | database_name |
| `MARIADB_USERNAME` | root |
| `MARIADB_PASSWORD` | password |

To awesome-mariadb-backup...

| Environment | Value |
| ---------------------- | --- |
| `TARGET_BUCKET_URL` | s3://some-bucket-name/backup-20220611170158.bz2 |
| `RESTORE_TOOL_OPTIONS` | --host mariadb --user root --one-database database_name |
| `MYSQL_PWD` | password |

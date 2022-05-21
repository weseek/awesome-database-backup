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

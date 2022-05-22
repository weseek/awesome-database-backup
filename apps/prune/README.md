# prune

Prune backuped files from Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Usage


### How to prune

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

## Authenticate storage service

S3 or GCS authentication is required depending on the storage service used.

- For S3
  - Set `AWS_REGION` and `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- For GCS
  - To use [service account authentication](https://cloud.google.com/docs/authentication/production), create JSON Web Key and set `GCP_SERVICE_JSON_PATH` and `GCP_PROJECT_ID`
  - To use [HMAC authentication](https://cloud.google.com/storage/docs/authentication/hmackeys), set `GCP_ACCESS_KEY_ID`, `GCP_SECRET_ACCESS_KEY`, and `GCP_PROJECT_ID`

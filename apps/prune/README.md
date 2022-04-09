# database-common

Awesome backup tools of database common.

## Usage


### How to list

```bash
$ yarn run build
$ node dist/mongodb/bin/list
```

```
Usage: list [options] <TARGET_BUCKET_URL>

Arguments:
  TARGET_BUCKET_URL                                                        URL of target bucket

Options:
  -V, --version                                                            output the version number
  --aws-region <AWS_REGION>                                                AWS Region
  --aws-access-key-id <AWS_ACCESS_KEY_ID>                                  Your IAM Access Key ID
  --aws-secret-access-key <AWS_SECRET_ACCESS_KEY>                          Your IAM Secret Access Key
  --gcp-project-id <GCP_PROJECT_ID>                                        GCP Project ID
  --gcp-private-key <GCP_PRIVATE_KEY>                                      GCP Private Key
  --gcp-client-email, <GCP_CLIENT_EMAIL>                                   GCP Client Email
  --gcp-service-account-key-json-path <GCP_SERVICE_ACCOUNT_KEY_JSON_PATH>  JSON file path to your GCP Service Account Key
  -h, --help                                                               display help for command
```

### How to prune

```bash
$ yarn run build
$ node dist/mongodb/bin/prune
```

```
Usage: prune [options] <TARGET_BUCKET_URL>

Arguments:
  TARGET_BUCKET_URL                                                        URL of target bucket

Options:
  -V, --version                                                            output the version number
  --aws-region <AWS_REGION>                                                AWS Region
  --aws-access-key-id <AWS_ACCESS_KEY_ID>                                  Your IAM Access Key ID
  --aws-secret-access-key <AWS_SECRET_ACCESS_KEY>                          Your IAM Secret Access Key
  --gcp-project-id <GCP_PROJECT_ID>                                        GCP Project ID
  --gcp-private-key <GCP_PRIVATE_KEY>                                      GCP Private Key
  --gcp-client-email, <GCP_CLIENT_EMAIL>                                   GCP Client Email
  --gcp-service-account-key-json-path <GCP_SERVICE_ACCOUNT_KEY_JSON_PATH>  JSON file path to your GCP Service Account Key
  --backupfile-prefix <BACKUPFILE_PREFIX>                                  Prefix of backup file. (default: "backup")
  --delete-divide <DELETE_DIVIDE>                                          delete divide (default: 3)
  --delete-target-days-left <DELETE_TARGET_DAYS_LEFT>                      How many days ago to be deleted (default: 4)
  -h, --help                                                               display help for command
```

# [PACKAGE_NAME]

[PACKAGE_DESCRIPTION]

## Features

- [FEATURE_1]
- [FEATURE_2]
- [FEATURE_3]

## Installation

```bash
npm install @awesome-database-backup/[PACKAGE_NAME]
```

## Usage

### Basic Usage

```bash
[BASIC_USAGE_EXAMPLE]
```

### Options

```
[OPTIONS_HELP_OUTPUT]
```

### Examples

#### Prune Files from Amazon S3

```bash
[S3_EXAMPLE]
```

#### Prune Files from Google Cloud Storage

```bash
[GCS_EXAMPLE]
```

#### Using Environment Variables

```bash
[ENV_VARS_EXAMPLE]
```

## Deletion Policy

The prune command deletes old backup files based on the following policy:

### `delete-divide` Option

The `delete-divide` option (default: 3) determines how many files to keep per day. For example, if set to 3, the command will keep every 3rd file for each day.

### `delete-target-days-left` Option

The `delete-target-days-left` option (default: 4) specifies how many days ago to start deleting files. Files newer than this number of days will not be deleted.

### Example Scenario

If you have the following backup files:
```
backup-20220101010000.gz
backup-20220101020000.gz
backup-20220101030000.gz
backup-20220102010000.gz
backup-20220102020000.gz
backup-20220102030000.gz
backup-20220103010000.gz
backup-20220103020000.gz
backup-20220103030000.gz
backup-20220104010000.gz
backup-20220104020000.gz
backup-20220104030000.gz
backup-20220105010000.gz
backup-20220105020000.gz
backup-20220105030000.gz
```

With `delete-divide=3` and `delete-target-days-left=2`, the command will:
1. Keep all files from the last 2 days (20220104 and 20220105)
2. For older days, keep every 3rd file

After pruning, you'll have:
```
backup-20220101030000.gz
backup-20220102030000.gz
backup-20220103030000.gz
backup-20220104010000.gz
backup-20220104020000.gz
backup-20220104030000.gz
backup-20220105010000.gz
backup-20220105020000.gz
backup-20220105030000.gz
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

- [[RELATED_COMMAND_1]](../[RELATED_COMMAND_1_PATH]/README.md) - [RELATED_COMMAND_1_DESCRIPTION]
- [[RELATED_COMMAND_2]](../[RELATED_COMMAND_2_PATH]/README.md) - [RELATED_COMMAND_2_DESCRIPTION]
- [[RELATED_COMMAND_3]](../[RELATED_COMMAND_3_PATH]/README.md) - [RELATED_COMMAND_3_DESCRIPTION]

# [PACKAGE_NAME]

[PACKAGE_DESCRIPTION]

## Features

- [FEATURE_1]
- [FEATURE_2]
- [FEATURE_3]
- [FEATURE_4]

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

#### Restore from Amazon S3

```bash
[S3_EXAMPLE]
```

#### Restore from Google Cloud Storage

```bash
[GCS_EXAMPLE]
```

#### Using Environment Variables

```bash
[ENV_VARS_EXAMPLE]
```

#### Specifying Restore Options

```bash
[RESTORE_OPTIONS_EXAMPLE]
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

[MIGRATION_SECTION]

## Related Commands

- [[RELATED_COMMAND_1]](../[RELATED_COMMAND_1_PATH]/README.md) - [RELATED_COMMAND_1_DESCRIPTION]
- [[RELATED_COMMAND_2]](../[RELATED_COMMAND_2_PATH]/README.md) - [RELATED_COMMAND_2_DESCRIPTION]
- [[RELATED_COMMAND_3]](../[RELATED_COMMAND_3_PATH]/README.md) - [RELATED_COMMAND_3_DESCRIPTION]

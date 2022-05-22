[![Application test](https://github.com/ryu-sato/awesome-database-backup/actions/workflows/test.yaml/badge.svg)](https://github.com/ryu-sato/awesome-database-backup/actions/workflows/test.yaml)
[![Container test](https://github.com/ryu-sato/awesome-database-backup/actions/workflows/container-test.yaml/badge.svg)](https://github.com/ryu-sato/awesome-database-backup/actions/workflows/container-test.yaml)

# What is awesome-database-backup

Collection of CLI executable npm packages which backup/restore databases to/from Cloud storage services like Amazon S3 or Google Cloud Storage.

# How to execute

Refer to the "README" corresponding to the database you are using.

- For mongoDB, you can use [awesome-mongodb-backup](./apps/awesome-mongodb-backup)
- For PostgreSQL, you can use [awesome-postgresql-backup](./apps/awesome-postgresql-backup)
- For MariaDB, you can use [awesome-mariadb-backup](./apps/awesome-mariadb-backup)

## Authenticate storage service

S3 or GCS authentication is required depending on the storage service used.

- For S3
  - Set `AWS_REGION` and `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- For GCS
  - To use [service account authentication](https://cloud.google.com/docs/authentication/production), create JSON Web Key and set `GCP_SERVICE_JSON_PATH` and `GCP_PROJECT_ID`
  - To use [HMAC authentication](https://cloud.google.com/storage/docs/authentication/hmackeys), set `GCP_ACCESS_KEY_ID`, `GCP_SECRET_ACCESS_KEY`, and `GCP_PROJECT_ID`

# Migrate from [weseek/awesome-mongodb-backup](https://github.com/weseek/awesome-mongodb-backup) / [weseek/awesome-mariadb-backup](https://github.com/weseek/awesome-mariadb-backup)

- From weseek/awesome-mongodb-backup, you can use [awesome-mongodb-backup](./apps/awesome-mongodb-backup)
- From weseek/awesome-mariadb-backup, you can use [awesome-mariadb-backup](./apps/awesome-mariadb-backup)

# How to contribute

see. [CONTRIBUTING](./CONTRIBUTING.md)

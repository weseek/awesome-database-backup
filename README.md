[![Application - Test](https://github.com/weseek/awesome-database-backup/actions/workflows/app-test.yaml/badge.svg)](https://github.com/weseek/awesome-database-backup/actions/workflows/app-test.yaml)
[![Container - Test](https://github.com/weseek/awesome-database-backup/actions/workflows/container-test.yaml/badge.svg)](https://github.com/weseek/awesome-database-backup/actions/workflows/container-test.yaml)

# What is awesome-database-backup

A collection of CLI executable npm packages which backup/restore databases to/from Cloud storage services like Amazon S3 or Google Cloud Storage.

## Key Features

- Backup and restore for multiple database types (MongoDB, PostgreSQL, MariaDB, File)
- Support for major cloud storage services (S3, GCS)
- Streaming mode for efficient large data transfers
- Cron scheduling for automated backups
- Docker support for containerized environments

## Project Structure

This project is organized as a monorepo with the following directory structure:

- `apps/`: Applications for each database type
  - `awesome-*-backup/`: User-facing packages (with README, etc.)
  - `*-backup/`: Backup command implementations
  - `*-restore/`: Restore command implementations
  - `list/`: Command implementation for listing files in a bucket
  - `prune/`: Command implementation for deleting old backup files
- `packages/`: Shared packages
  - `commands/`: Common command functionality
  - `storage-service-clients/`: Storage service clients
  - `*-test/`: Test utilities
- `docker/`: Docker image related files
- `misc/`: Miscellaneous utilities

## How to Use

Refer to the README corresponding to the database you are using:

- For MongoDB, use [awesome-mongodb-backup](./apps/awesome-mongodb-backup)
- For PostgreSQL, use [awesome-postgresql-backup](./apps/awesome-postgresql-backup)
- For MariaDB, use [awesome-mariadb-backup](./apps/awesome-mariadb-backup)
- For File backups, use [awesome-file-backup](./apps/awesome-file-backup)

## Migration from Previous Repositories

- From [weseek/mongodb-awesome-backup](https://github.com/weseek/mongodb-awesome-backup), use [awesome-mongodb-backup](./apps/awesome-mongodb-backup)
- From [weseek/mariadb-awesome-backup](https://github.com/weseek/mariadb-awesome-backup), use [awesome-mariadb-backup](./apps/awesome-mariadb-backup)

## How to Contribute

For information on contributing to this project, please see [CONTRIBUTING](./docs/CONTRIBUTING.md).

For a detailed understanding of the project architecture, see [ARCHITECTURE](./docs/ARCHITECTURE.md).

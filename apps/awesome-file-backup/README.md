# What is awesome-file-backup

Collection of CLI executable npm packages which backup data stored in a file system and store to Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Usage

See "README.md" each command follows or run command with "--help" option.

- [file-backup](../file-backup/README.md)
- [file-restore](../file-restore/README.md)
- [list](../list/README.md)
- [prune](../prune/README.md)

### With docker image

Backed up file names will be time-stamped. (ex. `backup-20220611170158.bz2`)

Timezone is not set as default so time-stamp show UTC.
If you want to change it, set the `TZ` environment variable. (see. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

# Migrate from `weseek/awesome-file-backup`

See follows
- [file-backup](../file-backup/README.md)
- [file-restore](../file-restore/README.md)

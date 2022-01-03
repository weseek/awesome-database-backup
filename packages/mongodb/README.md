# mongodb

Awesome backup tools of MongoDB.

## Usage

### How to backup

```bash
$ yarn run build
$ node dist/mongodb/bin/backup
```

```
Usage: backup [options] <TARGET_BUCKET_URL>

Arguments:
  TARGET_BUCKET_URL                                URL of target bucket

Options:
  -V, --version                                    output the version number
  --aws-region <AWS_REGION>                        AWS Region
  --aws-access-key-id <AWS_ACCESS_KEY_ID>          Your IAM Access Key ID
  --aws-secret-access-key <AWS_SECRET_ACCESS_KEY>  Your IAM Secret Access Key
  --backupfile-prefix <BACKUPFILE_PREFIX>          Prefix of backup file. (default: "backup")
  --mongodb-host                                   Specifies the resolvable hostname of the MongoDB deployment.By default, `backup` attempts to connect to a MongoDB instancerunning on the "mongo" on port number 27017. (default: "mongo")
  --cronmode                                       Run `backup` as cron mode. In Cron mode, `backup` will be executed periodically. (default: false)
  --cron-expression <CRON_EXPRESSION>              Cron expression (ex. CRON_EXPRESSION="0 4 * * *" if you want to run at 4:00 every day)
  -h, --help                                       display help for command
```

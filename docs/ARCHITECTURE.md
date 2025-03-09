# Architecture

This document describes the architecture of the awesome-database-backup project, including command structure, execution flow, storage service clients, Docker configuration, and CI/CD setup.

## Command Structure

Each command (backup, restore, list, prune) is implemented by inheriting from common base classes:

1. `StorageServiceClientCommand`: Base class for all commands
   - Provides common functionality related to storage services (S3, GCS)
   - Creates and manages storage service clients

2. Command-specific base classes:
   - `BackupCommand`: Base class for backup commands
   - `RestoreCommand`: Base class for restore commands
   - `ListCommand`: Base class for list commands
   - `PruneCommand`: Base class for prune commands

3. Database-specific implementation classes:
   - `MongoDBBackupCommand`: Backup command for MongoDB
   - `PostgreSQLBackupCommand`: Backup command for PostgreSQL
   - `MariaDBBackupCommand`: Backup command for MariaDB
   - etc.

## Backup and Restore Execution Flow

### Backup Execution Modes

Backup commands have the following execution modes:

1. Normal mode (using temporary files)
   - `backupOnce()`: Executes backup once
   - Saves database dump to a temporary file, then uploads it to the storage service
   - Implementation example:
     ```typescript
     async backupOnce(options: IBackupCommandOption): Promise<void> {
       // Dump database to a temporary file
       const { dbDumpFilePath } = await this.dumpDB(options);
       // Upload the temporary file to the storage service
       await this.storageServiceClient.copyFile(dbDumpFilePath, options.targetBucketUrl.toString());
     }
     ```

2. Streaming mode (without using temporary files)
   - `backupOnceWithStream()`: Executes backup in streaming mode
   - Uploads database dump directly to the storage service as a stream
   - Reduces disk I/O and is efficient for transferring large data
   - Implementation example:
     ```typescript
     async backupOnceWithStream(options: IBackupCommandOption): Promise<void> {
       // Get database dump as a stream
       const stream = await this.dumpDBAsStream(options);
       // Upload the stream directly to the storage service
       await this.storageServiceClient.uploadStream(
         stream,
         `${options.backupfilePrefix}-${format(Date.now(), 'yyyyMMddHHmmss')}.gz`,
         options.targetBucketUrl.toString(),
       );
     }
     ```

3. Cron mode
   - `backupCronMode()`: Executes backup periodically
   - Executes backup periodically based on the specified cron expression
   - Implementation example:
     ```typescript
     async backupCronMode(options: IBackupCommandOption): Promise<void> {
       await schedule.scheduleJob(
         options.cronmode,
         async() => {
           await this.backupOnce(options);
         },
       );
     }
     ```

### Restore Execution Flow

The restore command restores the database using the following steps:

1. Download backup file
   - Download backup file from cloud storage
   - Save to a temporary directory

2. Extract backup file
   - Extract file according to compression format (.gz, .bz2, .tar, etc.)
   - Implementation example:
     ```typescript
     async processBackupFile(backupFilePath: string): Promise<string> {
       const processors: Record<string, Transform> = {
         '.gz': createGunzip(),
         '.bz2': bz2(),
         '.tar': new tar.Unpack({ cwd: dirname(backupFilePath) }),
       };

       let newBackupFilePath = backupFilePath;
       const streams: (Transform|ReadStream|WriteStream)[] = [];

       streams.push(createReadStream(backupFilePath));
       while (extname(newBackupFilePath) !== '') {
         const ext = extname(newBackupFilePath);
         if (processors[ext] == null) throw new Error(`Extension ${ext} is not supported`);

         streams.push(processors[ext]);
         newBackupFilePath = newBackupFilePath.slice(0, -ext.length);
       }
       // If last stream is not of '.tar', add file writing stream.
       if (streams.at(-1) !== processors['.tar']) {
         streams.push(createWriteStream(newBackupFilePath));
       }

       return StreamPromises
         .pipeline(streams)
         .then(() => newBackupFilePath);
     }
     ```

3. Restore to database
   - Restore database using the extracted file
   - Execute database-specific restore command
   - Implementation example (MongoDB):
     ```typescript
     async restoreDB(sourcePath: string, userSpecifiedOption?: string): Promise<{ stdout: string; stderr: string; }> {
       return exec(`mongorestore ${sourcePath} ${userSpecifiedOption}`);
     }
     ```

4. Clean up temporary files
   - Delete temporary files after restore is complete

## Storage Service Clients

Storage service clients provide operations for cloud storage services such as S3 and GCS:

1. `IStorageServiceClient`: Interface for storage service clients
   - `exists()`: Check if a file exists
   - `listFiles()`: Get file list
   - `deleteFile()`: Delete a file
   - `copyFile()`: Copy a file
   - `uploadStream()`: Upload from a stream

2. Concrete implementations:
   - `S3StorageServiceClient`: Client for S3
     - Uses AWS SDK for JavaScript
     - Supports S3-compatible services (e.g., DigitalOcean Spaces)
     - Custom endpoint URL configuration is possible
   - `GCSStorageServiceClient`: Client for GCS
     - Uses Google Cloud Storage Node.js client library
     - Supports service account authentication

3. Factory pattern:
   - `storageServiceClientFactory`: Creates appropriate client based on URL scheme
   - `getStorageServiceClientType`: Determines client type from URL scheme
   ```typescript
   // s3://bucket-name/path -> 'S3'
   // gs://bucket-name/path -> 'GCS'
   ```

4. URI parsing:
   - S3 URI: `s3://bucket-name/path` -> `{ bucket: 'bucket-name', key: 'path' }`
   - GCS URI: `gs://bucket-name/path` -> `{ bucket: 'bucket-name', filepath: 'path' }`

## File Operation Types

Storage service clients support the following types of file operations:

1. Local file → Cloud storage (Upload)
   ```typescript
   // For S3
   async uploadFile(sourceFilePath: string, destinationS3Uri: S3URI): Promise<void> {
     const params = {
       Bucket: destinationS3Uri.bucket,
       Key: destinationS3Uri.key,
       Body: readFileSync(sourceFilePath),
     };
     const command = new PutObjectCommand(params);
     await this.client.send(command);
   }
   ```

2. Cloud storage → Local file (Download)
   ```typescript
   // For S3
   async downloadFile(sourceS3Uri: S3URI, destinationFilePath: string): Promise<void> {
     const params = {
       Bucket: sourceS3Uri.bucket,
       Key: sourceS3Uri.key,
     };
     const command = new GetObjectCommand(params);
     const response = await this.client.send(command);
     await StreamPromises.pipeline(
       response.Body as Readable,
       createWriteStream(destinationFilePath),
     );
   }
   ```

3. Copy within cloud storage
   ```typescript
   // For S3
   async copyFileOnRemote(sourceS3Uri: S3URI, destinationS3Uri: S3URI): Promise<void> {
     const params = {
       CopySource: [sourceS3Uri.bucket, sourceS3Uri.key].join('/'),
       Bucket: destinationS3Uri.bucket,
       Key: destinationS3Uri.key,
     };
     const command = new CopyObjectCommand(params);
     await this.client.send(command);
   }
   ```

4. Upload from stream
   ```typescript
   // For S3
   async uploadStream(stream: Readable, fileName: string, destinationUri: string): Promise<void> {
     const destinationS3Uri = this._parseFilePath(destinationUri);
     const chunks: Buffer[] = [];
     for await (const chunk of stream) {
       chunks.push(Buffer.from(chunk));
     }
     const buffer = Buffer.concat(chunks);
     const params = {
       Bucket: destinationS3Uri.bucket,
       Key: [destinationS3Uri.key, fileName].join('/'),
       Body: buffer,
     };
     const command = new PutObjectCommand(params);
     await this.client.send(command);
   }
   ```

## Docker

Docker images are created using multi-stage builds:

### Multi-stage Build Configuration

1. Base image: `node` with appropriate distribution
   - **Note**: The OS distribution of the base image should match the distribution used in the development container to ensure compatibility

2. Prune stage: Extract only necessary packages from the monorepo
   ```dockerfile
   FROM base AS pruned-package
   ARG packageFilter
   COPY . .
   RUN npx turbo@2 prune --docker "${packageFilter}"
   ```

3. Dependency resolution stage: Install dependencies for required packages
   ```dockerfile
   FROM base AS deps-resolver
   COPY --from=pruned-package --chown=node:node ${optDir}/out/json/ .
   COPY --from=pruned-package --chown=node:node ${optDir}/out/yarn.lock ./yarn.lock
   RUN yarn --frozen-lockfile
   ```

4. Build stage: Build the application
   ```dockerfile
   FROM base AS builder
   ARG packageFilter
   ENV NODE_ENV=production
   COPY --from=deps-resolver --chown=node:node ${optDir}/ ${optDir}/
   COPY --from=pruned-package --chown=node:node ${optDir}/out/full/ ${optDir}/
   RUN yarn run turbo run build --filter="${packageFilter}..."
   ```

5. Tool stage: Install database-specific tools
   ```dockerfile
   FROM base AS tool-common
   RUN apt-get update && apt-get install -y bzip2 curl ca-certificates gnupg

   FROM tool-common AS mongodb-tools
   ARG dbToolVersion
   RUN . /tmp/install-functions.sh && install_mongo_tools "${dbToolVersion}"

   FROM tool-common AS postgresql-tools
   ARG dbToolVersion
   RUN . /tmp/install-functions.sh && install_postgresql_tools "${dbToolVersion}"

   FROM tool-common AS mariadb-tools
   ARG dbToolVersion
   RUN . /tmp/install-functions.sh && install_mariadb_tools "${dbToolVersion}"
   ```

6. Release stage: Create the final image
   ```dockerfile
   FROM ${dbType:-file}-tools AS release
   ARG packagePath
   ENV NODE_ENV=production
   COPY --from=builder --chown=node:node ${optDir}/ ${appDir}/
   COPY ./docker/entrypoint.sh ${appDir}/
   ENTRYPOINT ["/app/entrypoint.sh"]
   CMD ["backup", "list", "prune"]
   ```

### Building Docker Images

Different images can be built for each database type:

```bash
# Build image for MongoDB backup
docker build -t awesome-mongodb-backup \
  --build-arg dbType=mongodb \
  --build-arg dbToolVersion=100.10.0 \
  --build-arg packageFilter=awesome-mongodb-backup \
  --build-arg packagePath=apps/awesome-mongodb-backup \
  -f docker/Dockerfile .

# Build image for PostgreSQL backup
docker build -t awesome-postgresql-backup \
  --build-arg dbType=postgresql \
  --build-arg dbToolVersion=17 \
  --build-arg packageFilter=awesome-postgresql-backup \
  --build-arg packagePath=apps/awesome-postgresql-backup \
  -f docker/Dockerfile .

# Build image for MariaDB backup
docker build -t awesome-mariadb-backup \
  --build-arg dbType=mariadb \
  --build-arg dbToolVersion=11.7.2 \
  --build-arg packageFilter=awesome-mariadb-backup \
  --build-arg packagePath=apps/awesome-mariadb-backup \
  -f docker/Dockerfile .
```

### Docker Image Usage Examples

```bash
# Run MongoDB backup
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/ \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  -e BACKUP_TOOL_OPTIONS="--uri mongodb://mongo:27017/mydb" \
  awesome-mongodb-backup backup

# List backup files
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/ \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  awesome-mongodb-backup list

# Delete old backup files
docker run --rm \
  -e TARGET_BUCKET_URL=s3://my-bucket/backups/ \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  awesome-mongodb-backup prune
```

## CI/CD

GitHub Actions are used to run the following workflows:

### Application Test Workflow

Defined in `.github/workflows/app-test.yaml`:

```yaml
name: Application - Test

on:
  push:
    branches-ignore: [stable]
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  app-test:
    runs-on: ubuntu-latest
    steps:
    - name: Get UID/GID
      id: ids
      run: |
        echo "uid=$(id -u)" >> $GITHUB_OUTPUT
        echo "gid=$(id -g)" >> $GITHUB_OUTPUT
    - uses: actions/checkout@v4
    # The "docker-container" driver is used because of using cache
    - uses: docker/setup-buildx-action@v3
    # Store the App container image in the local and Github Action cache, respectively
    - name: Build app container to caching (No push)
      uses: docker/build-push-action@v6
      with:
        context: .devcontainer
        build-args: |
          USER_UID=${{ steps.ids.outputs.uid }}
          USER_GID=${{ steps.ids.outputs.gid }}
        load: true
        cache-from: type=gha
        cache-to: type=gha,mode=max
    - name: Start all DBs and middle
      run: |
        docker compose -f .devcontainer/compose.yml build --build-arg USER_UID=${{ steps.ids.outputs.uid }} --build-arg USER_GID=${{ steps.ids.outputs.gid }}
        docker compose -f .devcontainer/compose.yml up -d
    - name: Run test
      run:
        docker compose -f .devcontainer/compose.yml exec -e NODE_OPTIONS -e CI -T -- node bash -c 'yarn install && yarn test'
    - name: Show test report to result of action
      if: success() || failure()
      uses: ctrf-io/github-test-reporter@v1
      with:
        report-path: '**/ctrf/*.json'
    - name: Show coverage report follow the settings .octocov.yml
      if: success() || failure()
      uses: k1LoW/octocov-action@v1
```

### Container Test Workflow

Defined in `.github/workflows/container-test.yaml`:

```yaml
name: Container - Test

on:
  push:
    branches-ignore: [stable]
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  container-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        db-type: [mongodb, postgresql, mariadb, file]
    steps:
    - uses: actions/checkout@v4
    # The "docker-container" driver is used because of using cache
    - uses: docker/setup-buildx-action@v3
    # Build container image
    - name: Build container image
      uses: docker/build-push-action@v6
      with:
        context: .
        file: docker/Dockerfile
        build-args: |
          dbType=${{ matrix.db-type }}
          dbToolVersion=100.10.0
          packageFilter=awesome-${{ matrix.db-type }}-backup
          packagePath=apps/awesome-${{ matrix.db-type }}-backup
        load: true
        tags: awesome-${{ matrix.db-type }}-backup:test
        cache-from: type=gha
        cache-to: type=gha,mode=max
    # Test container image
    - name: Test container image
      run: |
        docker run --rm awesome-${{ matrix.db-type }}-backup:test --help
```

### Test Reports

Test results are output in the following formats:

1. Jest Test Report:
   - When the CI environment variable is set (in CI environments), test reports are created in `**/ctrf/*.json` format
   - When the CI environment variable is not set (local development), only test summaries are displayed in the console
   - The ctrf-io/github-test-reporter action is used to display these reports in GitHub Actions

2. Coverage Report: Generated according to `.octocov.yml` settings
   - Displayed using k1LoW/octocov-action

### Workflow Features

1. Concurrency control
   ```yaml
   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: true
   ```
   - Prevents multiple workflows from running for the same branch
   - Cancels in-progress workflows when new commits are pushed

2. Cache utilization
   ```yaml
   cache-from: type=gha
   cache-to: type=gha,mode=max
   ```
   - Uses GitHub Actions cache to reduce build time

3. Matrix builds
   ```yaml
   strategy:
     matrix:
       db-type: [mongodb, postgresql, mariadb, file]
   ```
   - Runs tests in parallel for multiple database types

# Architecture

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

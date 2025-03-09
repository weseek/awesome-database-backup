# Contribution

## Abstraction

First, thank you very much for your contributions! :tada:

For a detailed understanding of the project architecture, please refer to [ARCHITECTURE.md](./ARCHITECTURE.md).

### Language on GitHub

You can write issues and PRs in English or Japanese.

### Posting Pull Requests

* Make sure to post PRs which based on latest master branch.
* Please make sure to pass the test suite before posting your PR.
    * Run `yarn test`

# Coding Rules

## 1. Command Implementation

When implementing a command for a new database:

1. Inherit from the appropriate base class
   ```typescript
   class NewDBBackupCommand extends BackupCommand {
     // ...
   }
   ```

2. Implement abstract methods
   ```typescript
   async dumpDB(options: IBackupCommandOption): Promise<{ stdout: string, stderr: string, dbDumpFilePath: string }> {
     // Implement database-specific dump process
   }
   ```

3. Add options as needed
   ```typescript
   addBackupOptions(): this {
     return super.addBackupOptions()
       .addOption(
         new Option(
           '--new-option <VALUE>',
           'Description of the new option',
         )
       );
   }
   ```

## 2. Storage Service Client

When implementing a new storage service client:

1. Implement the `IStorageServiceClient` interface
   ```typescript
   class NewStorageServiceClient implements IStorageServiceClient {
     // ...
   }
   ```

2. Implement all required methods
   ```typescript
   async exists(url: string): Promise<boolean> {
     // Implementation
   }

   async listFiles(url: string, options?: any): Promise<string[]> {
     // Implementation
   }

   // Other methods
   ```

3. Register the new client in the factory
   ```typescript
   // factory.ts
   export function storageServiceClientFactory(
       type: StorageServiceClientType,
       options: any,
   ): IStorageServiceClient {
     const factoryMap: { type: StorageServiceClientType, factory: any }[] = [
       // Existing entries
       { type: 'NEW', factory: (options: any) => new NewStorageServiceClient(options) },
     ];
     // ...
   }
   ```

## 3. Option Definition

Command options are defined as interfaces:

```typescript
export interface INewCommandOption extends ICommonCommandOption {
  newOption1: string,
  newOption2?: number,
  // Other options
}
```

## 4. Error Handling

Catch errors appropriately and log them:

```typescript
try {
  // Process
} catch (e: any) {
  logger.error(`An error occurred: ${e.message}`);
  // Re-throw exception if necessary
  throw e;
}
```

# Testing

Each command must have corresponding tests:

1. Create test files in the `__tests__` directory
2. Implement tests using Jest
3. Utilize test utility packages

```typescript
describe('NewDBBackupCommand', () => {
  it('should backup database', async () => {
    // Test implementation
  });

  // Other tests
});
```

## Test Patterns

Tests should cover the following patterns:

1. Test for when help option is specified
   ```typescript
   describe('when option --help is specified', () => {
     const commandLine = `${execBackupCommand} --help`;
     it('show help messages', async() => {
       expect(await exec(commandLine)).toEqual({
         stdout: expect.stringContaining('Usage:'),
         stderr: '',
       });
     });
   });
   ```

2. Error test for when required options are not specified
   ```typescript
   describe('when no option is specified', () => {
     const commandLine = `${execBackupCommand}`;
     it('throw error message', async() => {
       await expect(exec(commandLine)).rejects.toThrowError(
         /required option '--target-bucket-url <TARGET_BUCKET_URL> \*\*MANDATORY\*\*' not specified/,
       );
     });
   });
   ```

3. Normal case test for when valid options are specified
   ```typescript
   describe('when valid S3 options are specified', () => {
     beforeEach(cleanTestS3Bucket);
     beforeEach(prepareTestDB);

     it('backup database in bucket', async() => {
       expect(await exec(commandLine)).toEqual({
         stdout: expect.stringMatching(/=== backup.ts started at .* ===/),
         stderr: '',
       });
     });
   });
   ```

4. Test for when special options like stream mode are specified

## Test Utilities

Test utility packages are available:

- `@awesome-database-backup/storage-service-test`: Test utilities for storage services (S3, GCS)
  - Preparation of test buckets
  - Cleanup of buckets
  - Listing files in buckets

- `@awesome-database-backup/*-test`: Test utilities for each database
  - Preparation of test databases
  - Insertion of test data
  - Providing connection information

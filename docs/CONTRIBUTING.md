# Contribution

This document provides guidelines for contributing to the awesome-database-backup project.

## Introduction

First, thank you very much for your contributions! :tada:

For a detailed understanding of the project architecture, please refer to [ARCHITECTURE.md](./ARCHITECTURE.md).

### Language on GitHub

You can write issues and PRs in English or Japanese.

### Posting Pull Requests

* Make sure to post PRs based on the latest master branch.
* Please make sure to pass the test suite before posting your PR.
    * Run `yarn test`

## Coding Rules

### Command Implementation

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

### Storage Service Client

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

### Option Definition

Command options are defined as interfaces:

```typescript
export interface INewCommandOption extends ICommonCommandOption {
  newOption1: string,
  newOption2?: number,
  // Other options
}
```

### Error Handling

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

## Testing

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

### Test Patterns

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

### Test Utilities

Test utility packages are available:

- `@awesome-database-backup/storage-service-test`: Test utilities for storage services (S3, GCS)
  - Preparation of test buckets
  - Cleanup of buckets
  - Listing files in buckets

- `@awesome-database-backup/*-test`: Test utilities for each database
  - Preparation of test databases
  - Insertion of test data
  - Providing connection information

## Versioning

For version management, use the `bump-version` script:

```bash
# Increase patch version
npm run bump-version:patch

# Increase minor version
npm run bump-version:minor

# Increase major version
npm run bump-version:major
```

### Versioning Mechanism

Versioning is implemented in the `misc/bump-versions` package:

1. Version update flow:
   - Update the version in `package.json` for each package
   - Update dependency versions
   - Create commit and tag

2. Configuration file: `.bump-versionsrc.js`
   ```javascript
   module.exports = {
     // Packages to update versions for
     packages: [
       'apps/*',
       'packages/*',
     ],
     // Commit message after version update
     commitMessage: 'chore: bump version to %s',
     // Tag after version update
     tagName: 'v%s',
   };
   ```

3. Semantic versioning:
   - Patch version (x.y.Z): Bug fixes and small changes
   - Minor version (x.Y.z): Backward-compatible feature additions
   - Major version (X.y.z): Backward-incompatible changes

### Release Process

1. Work on development branch
   - Implement feature additions or bug fixes
   - Run tests to verify functionality

2. Update version
   ```bash
   # Update version according to the type of change
   npm run bump-version:patch  # or :minor, :major
   ```

3. Merge to release branch
   - Merge to `stable` branch
   - Verify that CI tests pass

4. Create release tag
   - Use tag automatically created during version update
   - Or manually create tag: `git tag v0.3.2`

5. Create release notes
   - Use GitHub Releases
   - Document major changes

import { Command, Option } from 'commander';
import {
  IStorageServiceClient,
  getStorageServiceClientType,
  storageServiceClientFactory,
} from '@awesome-database-backup/storage-service-clients';
import { ICommonCommandOption } from './interfaces';

/**
 * Define common processing for "backup", "restore", "list", and "prune" commands.
 */
export class StorageServiceClientCommand extends Command {

  storageServiceClient: IStorageServiceClient | null;

  constructor() {
    super();
    this.storageServiceClient = null;
  }

  addStorageOptions(): this {
    return this
      .addOption(
        // Arguments cannot be set to value from environment variable, so we use the required option
        new Option('--target-bucket-url <TARGET_BUCKET_URL> **MANDATORY**', 'Target Bucket URL ([s3://...|gs://...])')
          .makeOptionMandatory()
          .argParser(value => new URL(value))
          .env('TARGET_BUCKET_URL'),
      );
  }

  saveStorageClientInAdvance(): this {
    return this
      .hook('preAction', (command: Command) => {
        const options = command.opts() as ICommonCommandOption;

        const type = getStorageServiceClientType(options.targetBucketUrl);
        if (type == null) throw new Error(`Unknown storage provider type: ${type}`);

        this.storageServiceClient = storageServiceClientFactory(type);
      });
  }

}

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
      )
      /* AWS options */
      .addOption(
        new Option('--aws-endpoint-url <AWS_ENDPOINT_URL>', 'URL to send the request to')
          .argParser(value => new URL(value))
          .env('AWS_ENDPOINT_URL'),
      )
      .addOption(
        new Option('--aws-region <AWS_REGION>', 'AWS Region')
          .env('AWS_REGION'),
      )
      .addOption(
        new Option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID')
          .env('AWS_ACCESS_KEY_ID'),
      )
      .addOption(
        new Option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key')
          .env('AWS_SECRET_ACCESS_KEY'),
      )
      /* GCS options */
      .addOption(
        new Option('--gcp-endpoint-url <GCP_ENDPOINT_URL>', 'URL to send the request to')
          .argParser(value => new URL(value))
          .env('GCP_ENDPOINT_URL'),
      )
      .addOption(
        new Option('--gcp-project-id <GCP_PROJECT_ID>', 'GCP Project ID')
          .env('GCP_PROJECT_ID'),
      )
      .addOption(
        new Option('--gcp-private-key <GCP_PRIVATE_KEY>', 'GCP Private Key')
          .env('GCP_PRIVATE_KEY'),
      )
      .addOption(
        new Option('--gcp-client-email <GCP_CLIENT_EMAIL>', 'GCP Client Email')
          .env('GCP_CLIENT_EMAIL'),
      )
      .addOption(
        new Option('--gcp-service-account-key-json-path <GCP_SERVICE_ACCOUNT_KEY_JSON_PATH>',
          'JSON file path to your GCP Service Account Key')
          .env('GCP_SERVICE_ACCOUNT_KEY_JSON_PATH'),
      );
  }

  saveStorageClientInAdvance(): this {
    return this
      .hook('preAction', (command: Command) => {
        const options = command.opts() as ICommonCommandOption;

        const type = getStorageServiceClientType(options.targetBucketUrl);
        if (type == null) throw new Error(`Unknown storage provider type: ${type}`);

        this.storageServiceClient = storageServiceClientFactory(type, options);
      });
  }

}

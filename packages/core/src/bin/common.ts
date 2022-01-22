import { Command } from 'commander';
import {
  configExistS3, createConfigS3,
} from '../factories/provider-config-factory';
import { IProvider } from '../interfaces/provider';
import { getProviderType } from '../factories/provider-factory';
import { S3Provider } from '../providers/s3';
import { GCSProvider } from '../providers/gcs';

/* List command option types */
export declare interface ICommonCLIOption {
  awsRegion?: string
  awsAccessKeyId?: string,
  awsSecretAccessKey?: string,
  gcpProjectId?: string,
  gcpClientEmail?: string,
  gcpPrivateKey?: string,
  gcpServiceAccountKeyJsonPath?: string,
}

export class BinCommon extends Command {

  provider: IProvider|null;

  constructor(name?: string) {
    super(name);

    this.provider = null;
  }

  providerOptions(): BinCommon {
    return this
      .s3ProviderOptions()
      .gcsProviderOptions();
  }

  providerGenerateHook(): BinCommon {
    return this
      .hook('preAction', (command) => {
        const options = command.opts() as ICommonCLIOption;
        const [targetBucketUrlString] = command.args;

        const targetBucketUrl = new URL(targetBucketUrlString);
        const type = getProviderType(targetBucketUrl);
        if (!type) throw new Error('URL scheme is not that of a supported provider.');

        switch (type) {
          case 'S3':
            this.validateS3ProviderOption(options);
            this.provider = this.s3Provider(options);
            break;

          case 'GCS':
            this.validateGCSProviderOption(options);
            this.provider = this.gcsProvider(options);
            break;
        }
      });
  }

  private s3ProviderOptions(): BinCommon {
    return this
      .option('--aws-region <AWS_REGION>', 'AWS Region')
      .option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID', process.env.AWS_ACCESS_KEY_ID)
      .option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key', process.env.AWS_SECRET_ACCESS_KEY);
  }

  private gcsProviderOptions(): BinCommon {
    return this
      .option('--gcp-project-id <GCP_PROJECT_ID>', 'GCP Project ID', process.env.GCLOUD_PROJECT)
      .option('--gcp-private-key <GCP_PRIVATE_KEY>', 'GCP Private Key')
      .option('--gcp-client-email, <GCP_CLIENT_EMAIL>', 'GCP Client Email')
      .option('--gcp-service-account-key-json-path <GCP_SERVICE_ACCOUNT_KEY_JSON_PATH>',
        'JSON file path to your GCP Service Account Key', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }

  private validateS3ProviderOption(options: ICommonCLIOption): void {

    if (configExistS3()) return;

    if (!options.awsRegion || !options.awsAccessKeyId || !options.awsSecretAccessKey) {
      throw new Error('If the configuration file does not exist, '
                        + 'you will need to set "--aws-region", "--aws-access-key-id", and "--aws-secret-access-key".');
    }
  }

  private validateGCSProviderOption(options: ICommonCLIOption): void {

    if (!options.gcpProjectId) {
      throw new Error('You will need to set "--gcp-project-id".');
    }
    if (!(options.gcpServiceAccountKeyJsonPath || (options.gcpClientEmail && options.gcpPrivateKey))) {
      throw new Error('You will need to set both "--gcp-access-key-id" and "--gcp-secret-access-key", or "--gcp-service-account-key-json-path".');
    }
  }

  /* If the configuration file does not exist, it is created temporarily from the options,
    and it will be deleted when process exit. */
  private s3Provider({
    awsRegion,
    awsAccessKeyId,
    awsSecretAccessKey,
  }: ICommonCLIOption): S3Provider|null {
    if (awsRegion == null || awsAccessKeyId == null || awsSecretAccessKey == null) return null;

    createConfigS3({ awsRegion, awsAccessKeyId, awsSecretAccessKey });
    return new S3Provider({});
  }

  /* Configuration file is created temporarily from the options, and it will be deleted when process exit. */
  private gcsProvider({
    gcpServiceAccountKeyJsonPath,
    gcpProjectId,
    gcpClientEmail,
    gcpPrivateKey,
  }: ICommonCLIOption): GCSProvider|null {
    if (gcpServiceAccountKeyJsonPath) {
      return new GCSProvider({ keyFilename: gcpServiceAccountKeyJsonPath });
    }

    if (gcpPrivateKey == null) return null;
    return new GCSProvider({
      projectId: gcpProjectId,
      credentials: {
        client_email: gcpClientEmail,
        private_key: gcpPrivateKey.replace(/\\n/g, '\n'),
      },
    });
  }
}

import { Command } from 'commander';
import { IProvider } from '../interfaces/provider';
import { getProviderType, generateS3Provider, generateGCSProvider } from '../factories/provider-factory';

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
            this.provider = generateS3Provider(options);
            return;

          case 'GCS':
            this.provider = generateGCSProvider(options);
            return;
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

}

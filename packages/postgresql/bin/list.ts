#!/usr/bin/env node

import { program } from 'commander';
import {
  configExistS3, createConfigS3,
  ListCLI, IListCLIOption,
  getProviderType,
  S3Provider, GCSProvider, IProvider,
} from '@awesome-backup/core';
import { PACKAGE_VERSION } from '../src/config/version';

program
  .version(PACKAGE_VERSION)
  .argument('<TARGET_BUCKET_URL>', 'URL of target bucket')
  /* Required fields that are intentionally treat as optional so that they can be specified by environment variables. */
  .option('--aws-region <AWS_REGION>', 'AWS Region')
  .option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID', process.env.AWS_ACCESS_KEY_ID)
  .option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key', process.env.AWS_SECRET_ACCESS_KEY)
  .option('--gcp-project-id <GCP_PROJECT_ID>', 'GCP Project ID', process.env.GCLOUD_PROJECT)
  .option('--gcp-private-key <GCP_PRIVATE_KEY>', 'GCP Private Key')
  .option('--gcp-client-email, <GCP_CLIENT_EMAIL>', 'GCP Client Email')
  .option('--gcp-service-account-key-json-path <GCP_SERVICE_ACCOUNT_KEY_JSON_PATH>',
    'JSON file path to your GCP Service Account Key', process.env.GOOGLE_APPLICATION_CREDENTIALS)
  .action(async(targetBucketUrlString, options: IListCLIOption) => {
    const targetBucketUrl = new URL(targetBucketUrlString);

    const type = getProviderType(targetBucketUrl);
    if (!type) {
      console.error('URL scheme is not that of a supported provider.');
      return;
    }

    let provider!: IProvider;
    switch (type) {
      case 'S3':
        if (configExistS3()) break;

        if (!options.awsRegion || !options.awsAccessKeyId || !options.awsSecretAccessKey) {
          console.error('If the configuration file does not exist, '
                        + 'you will need to set "--aws-region", "--aws-access-key-id", and "--aws-secret-access-key".');
          return;
        }

        /* If the configuration file does not exist, it is created temporarily from the options,
          and it will be deleted when process exit. */
        const { awsRegion, awsAccessKeyId, awsSecretAccessKey } = options;
        createConfigS3({ awsRegion, awsAccessKeyId, awsSecretAccessKey });
        provider = new S3Provider({});
        break;

      case 'GCS':
        if (!options.gcpProjectId) {
          console.error('You will need to set "--gcp-project-id".');
          return;
        }
        if (!(options.gcpServiceAccountKeyJsonPath || (options.gcpClientEmail && options.gcpPrivateKey))) {
          console.error('You will need to set both "--gcp-access-key-id" and "--gcp-secret-access-key", or "--gcp-service-account-key-json-path".');
          return;
        }

        /* Configuration file is created temporarily from the options, and it will be deleted when process exit. */
        if (options.gcpServiceAccountKeyJsonPath) {
          provider = new GCSProvider({ keyFilename: options.gcpServiceAccountKeyJsonPath });
        }
        else {
          provider = new GCSProvider({
            projectId: options.gcpProjectId,
            credentials: {
              client_email: options.gcpClientEmail,
              private_key: options.gcpPrivateKey.replace(/\\n/g, '\n'),
            },
          });
        }
        break;
    }

    const cli = new ListCLI(provider);
    await cli.main(targetBucketUrl)
      .catch((e: any) => console.error(e));
  });

program.parse(process.argv);

import { StorageProviderType } from '../interfaces/storage-service-client';
import {
  configExistS3, createConfigS3,
} from './provider-config-factory';
import { S3ServiceClient } from '../storage-service-clients/s3';
import { GCSServiceClient } from '../storage-service-clients/gcs';

export function storageProviderType(target: URL): StorageProviderType|undefined {
  const typeMap: Record<string, StorageProviderType> = {
    s3: 'S3',
    gs: 'GCS',
  };
  const key = target.protocol.replace(/:/, '');
  return typeMap[key];
}

export function generateS3ServiceClient({
  awsRegion,
  awsAccessKeyId,
  awsSecretAccessKey,
}: {
  awsRegion?: string,
  awsAccessKeyId?: string,
  awsSecretAccessKey?: string,
}): S3ServiceClient {
  /* If the configuration file does not exist, it is created temporarily from the options,
    and it will be deleted when process exit. */
  if (!configExistS3()) {
    if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('If the configuration file does not exist, '
                        + 'you will need to set "--aws-region", "--aws-access-key-id", and "--aws-secret-access-key".');
    }
    createConfigS3({ awsRegion, awsAccessKeyId, awsSecretAccessKey });
  }

  return new S3ServiceClient({});
}

export function generateGCSServiceClient({
  gcpServiceAccountKeyJsonPath,
  gcpProjectId,
  gcpClientEmail,
  gcpPrivateKey,
}: {
  gcpServiceAccountKeyJsonPath?: string,
  gcpProjectId?: string,
  gcpClientEmail?: string,
  gcpPrivateKey?: string,
}): GCSServiceClient {
  if (gcpServiceAccountKeyJsonPath) {
    return new GCSServiceClient({ keyFilename: gcpServiceAccountKeyJsonPath });
  }

  /* If the configuration file does not exist, it is created temporarily from the options,
    and it will be deleted when process exit. */
  if (![gcpProjectId, gcpClientEmail, gcpPrivateKey].every(it => it != null)) {
    throw new Error('If you does not set "--gcp-service-account-key-json-path", '
                      + 'you will need to set all of "--gcp-project-id", "--gcp-access-key-id" and "--gcp-secret-access-key".');
  }

  // [MEMO] Converting escaped characters because newline codes cannot be entered in the commander argument.
  const privateKey = gcpPrivateKey?.replace(/\\n/g, '\n');
  return new GCSServiceClient({
    projectId: gcpProjectId,
    credentials: {
      client_email: gcpClientEmail,
      private_key: privateKey,
    },
  });
}

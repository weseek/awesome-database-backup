import { StorageProviderType } from '../interfaces/storage-client';
import {
  configExistS3, createConfigS3,
} from './provider-config-factory';
import { S3Provider } from '../providers/s3';
import { GCSClient } from '../providers/gcs';

export function getStorageProviderType(target: URL): StorageProviderType|undefined {
  const typeMap: Record<string, StorageProviderType> = {
    s3: 'S3',
    gs: 'GCS',
  };
  const key = target.protocol.replace(/:/, '');
  return typeMap[key];
}

export function generateS3Provider({
  awsRegion,
  awsAccessKeyId,
  awsSecretAccessKey,
}: {
  awsRegion?: string,
  awsAccessKeyId?: string,
  awsSecretAccessKey?: string,
}): S3Provider {
  /* If the configuration file does not exist, it is created temporarily from the options,
    and it will be deleted when process exit. */
  if (!configExistS3()) {
    if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('If the configuration file does not exist, '
                        + 'you will need to set "--aws-region", "--aws-access-key-id", and "--aws-secret-access-key".');
    }
    createConfigS3({ awsRegion, awsAccessKeyId, awsSecretAccessKey });
  }

  return new S3Provider({});
}

export function generateGCSClient({
  gcpServiceAccountKeyJsonPath,
  gcpProjectId,
  gcpClientEmail,
  gcpPrivateKey,
}: {
  gcpServiceAccountKeyJsonPath?: string,
  gcpProjectId?: string,
  gcpClientEmail?: string,
  gcpPrivateKey?: string,
}): GCSClient {
  if (gcpServiceAccountKeyJsonPath) {
    return new GCSClient({ keyFilename: gcpServiceAccountKeyJsonPath });
  }

  /* If the configuration file does not exist, it is created temporarily from the options,
    and it will be deleted when process exit. */
  if (![gcpProjectId, gcpClientEmail, gcpPrivateKey].every(it => it != null)) {
    throw new Error('If you does not set "--gcp-service-account-key-json-path", '
                      + 'you will need to set all of "--gcp-project-id", "--gcp-access-key-id" and "--gcp-secret-access-key".');
  }

  // [MEMO] Converting escaped characters because newline codes cannot be entered in the commander argument.
  const privateKey = gcpPrivateKey?.replace(/\\n/g, '\n');
  return new GCSClient({
    projectId: gcpProjectId,
    credentials: {
      client_email: gcpClientEmail,
      private_key: privateKey,
    },
  });
}

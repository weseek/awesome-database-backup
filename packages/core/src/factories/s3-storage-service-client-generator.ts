import { S3ServiceClient } from '../storage-service-clients/s3';
import { configExistS3 } from './s3-storage-service-client-config';

export function generateS3ServiceClient({
  awsEndpointUrl,
  awsRegion,
  awsAccessKeyId,
  awsSecretAccessKey,
}: {
  awsEndpointUrl?: string,
  awsRegion?: string,
  awsAccessKeyId?: string,
  awsSecretAccessKey?: string,
}): S3ServiceClient {
  let s3ClientConfig = {};

  if (!configExistS3()) {
    if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('If the configuration file does not exist, '
                        + 'you will need to set "--aws-region", "--aws-access-key-id", and "--aws-secret-access-key".');
    }
    s3ClientConfig = {
      region: awsRegion,
      credentials: Object({
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      }),
    };
  }

  if (awsEndpointUrl != null) {
    s3ClientConfig = {
      ...s3ClientConfig,
      endpoint: awsEndpointUrl,
    };
  }
  return new S3ServiceClient(s3ClientConfig);
}

export interface S3StorageServiceClientConfig {
  awsEndpointUrl?: URL,
  awsRegion?: string,
  awsAccessKeyId?: string,
  awsSecretAccessKey?: string,
  awsForcePathStyle?: boolean,
}
export default S3StorageServiceClientConfig;

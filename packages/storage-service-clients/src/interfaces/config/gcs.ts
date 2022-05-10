export interface GCSStorageServiceClientConfig {
  gcpEndpointUrl?: URL,
  gcpServiceAccountKeyJsonPath?: string,
  gcpProjectId?: string,
  gcpClientEmail?: string,
  gcpPrivateKey?: string,
}
export default GCSStorageServiceClientConfig;

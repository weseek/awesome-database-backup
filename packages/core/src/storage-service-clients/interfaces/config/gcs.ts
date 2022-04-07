export interface GCSStorageServiceClientConfig {
  gcpEndpointUrl?: string,
  gcpServiceAccountKeyJsonPath?: string,
  gcpProjectId?: string,
  gcpClientEmail?: string,
  gcpPrivateKey?: string,
}
export default GCSStorageServiceClientConfig;

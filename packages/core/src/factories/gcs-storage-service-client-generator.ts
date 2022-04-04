import { GCSServiceClient } from '../storage-service-clients/gcs';

export function generateGCSServiceClient({
  gcpEndpointUrl,
  gcpServiceAccountKeyJsonPath,
  gcpProjectId,
  gcpClientEmail,
  gcpPrivateKey,
}: {
  gcpEndpointUrl?: string,
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
                      + 'you will need to set all of "--gcp-project-id", "--gcp-client-email" and "--gcp-private-key".');
  }

  // [MEMO] Converting escaped characters because newline codes cannot be entered in the commander argument.
  const privateKey = gcpPrivateKey?.replace(/\\n/g, '\n');
  const gcpAdditionalOption = gcpEndpointUrl
    ? { apiEndpoint: gcpEndpointUrl }
    : {};
  return new GCSServiceClient({
    projectId: gcpProjectId,
    credentials: {
      client_email: gcpClientEmail,
      private_key: privateKey,
    },
    ...gcpAdditionalOption,
  });
}

import { v4 as uuidv4 } from 'uuid';

export const storageConfig = {
  apiEndpoint: process.env.GCP_ENDPOINT_URL || 'http://fake-gcs-server:4443',
  projectId: process.env.GCP_PROJECT_ID || 'valid_project_id',
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL || 'valid@example.com',
    private_key: process.env.GCP_PRIVATE_KEY || 'valid_private_key',
  },
};

export const testGCSBucketName = `test-${uuidv4()}`;
export const testGCSBucketURI = `gs://${testGCSBucketName}`;

export default storageConfig;

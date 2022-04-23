import { v4 as uuidv4 } from 'uuid';

export const s3ClientConfig = {
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://s3.minio:9000',
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: Object({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
  }),
};

export const testS3BucketName = `test-${uuidv4()}`;
export const testS3BucketURI = `s3://${testS3BucketName}`;

export default s3ClientConfig;

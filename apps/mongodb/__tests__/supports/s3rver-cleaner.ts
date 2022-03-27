import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execOriginal);

export const testS3BucketURI = 's3://test';
export async function cleanTestS3Bucket(): Promise<void> {
  const awsCommand = '\
    AWS_ACCESS_KEY_ID="S3RVER" \
    AWS_SECRET_ACCESS_KEY="S3RVER" \
    aws \
    --endpoint-url http://s3.s3rver \
    --region us-east-1';
  try {
    await exec(`${awsCommand} s3 rb ${testS3BucketURI} --force`);
  }
  catch (e: any) {
    // If the bucket does not exist, an error occurs, but the error is caught and nothing is done
  }
  await exec(`${awsCommand} s3 mb ${testS3BucketURI}`);
}

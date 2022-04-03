import { statSync, writeFileSync } from 'fs';
import { join } from 'path';

const tmp = require('tmp');

function fileExists(path: string): boolean {
  const stat = statSync(path, { throwIfNoEntry: false });
  if (stat === undefined) {
    return false;
  }
  return stat.isFile();
}

/**
 * Return config file path and credential file of S3
 *
 * ex. { "configurationPath": "<BASE_DIR>/config", "<BASE_DIR>/credentials" }.
 *
 * Files are selected by following order.
 * 1. <AWS_CONFIG_FILE> and <AWS_SHARED_CREDENTIALS_FILE> files, if any
 * 2. files under $customConfigDir, if argument is set
 * 3. files under "<HOME>/.aws"} if HOME environment is set
 * 4. files under "/.aws" if HOME environment isn't set
 */
function configPathsS3(customConfigDir = ''): { configurationPath: string, credentialPath: string } {
  const defaultConfigDir = join(process.env.HOME || '/', '.aws');
  const configDir = customConfigDir || defaultConfigDir;
  return {
    configurationPath: process.env.AWS_CONFIG_FILE || join(configDir, 'config'),
    credentialPath: process.env.AWS_SHARED_CREDENTIALS_FILE || join(configDir, 'credentials'),
  };
}

export function configExistS3(): boolean {
  const { configurationPath, credentialPath } = configPathsS3();
  return (fileExists(configurationPath) && fileExists(credentialPath));
}

export function createConfigS3({ awsRegion, awsAccessKeyId, awsSecretAccessKey }: Record<string, string>): Record<string, string> {
  tmp.setGracefulCleanup();
  const tmpdir = tmp.dirSync({ unsafeCleanup: true });

  const { configurationPath, credentialPath } = configPathsS3(tmpdir.name);
  process.env.AWS_CONFIG_FILE = configurationPath;
  process.env.AWS_SHARED_CREDENTIALS_FILE = credentialPath;

  // see. https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-configure-files.html
  const configData = `
      [default]
      region=${awsRegion}
    `.replace(/^\s*/mg, '');
  writeFileSync(configurationPath, configData);

  const credentialData = `
      [default]
      aws_access_key_id=${awsAccessKeyId}
      aws_secret_access_key=${awsSecretAccessKey}
    `.replace(/^\s*/mg, '');
  writeFileSync(credentialPath, credentialData);

  return { configurationPath, credentialPath };
}

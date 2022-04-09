import { statSync } from 'fs';
import { join } from 'path';

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

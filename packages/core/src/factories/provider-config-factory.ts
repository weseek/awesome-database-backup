import { statSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

function fileExists(path: string): boolean {
  try {
    const stat = statSync(path);
    return stat.isFile();
  }
  catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

function configPaths(): Record<string, string> {
  const configDirectory = join(process.env.AWS_CONFIG_FILE || join(process.env.HOME || '/', '.aws'));
  const configurationPath = join(configDirectory, 'config');
  const credentialPath = join(configDirectory, 'credentials');
  return { configurationPath, credentialPath };
}

export function configExistS3(): boolean {
  const { configurationPath, credentialPath } = configPaths();
  return (fileExists(configurationPath) && fileExists(credentialPath));
}

export function unlinkConfigS3(): void {
  const { configurationPath, credentialPath } = configPaths();

  if (fileExists(configurationPath)) {
    unlinkSync(configurationPath);
  }
  if (fileExists(credentialPath)) {
    unlinkSync(credentialPath);
  }
}

export function createConfigS3({ awsRegion, awsAccessKeyId, awsSecretAccessKey }: Record<string, string>): Record<string, string> {
  const { configurationPath, credentialPath } = configPaths();

  /* Automatically remove config files */
  process.addListener('exit', unlinkConfigS3);
  process.addListener('SIGINT', unlinkConfigS3);

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

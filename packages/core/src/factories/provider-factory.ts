import { ProviderType } from '../interfaces/provider';

export function getProviderType(target: URL): ProviderType|undefined {
  const typeMap: Record<string, ProviderType> = {
    s3: 'S3',
    gs: 'GCS',
  };
  const key = target.protocol.replace(/:/, '');
  return typeMap[key];
}

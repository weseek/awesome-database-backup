import { join } from 'path';

export function fixturePath(fixtureName: string): string {
  return join(__dirname, fixtureName);
}

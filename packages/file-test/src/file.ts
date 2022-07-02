import { v4 as uuidv4 } from 'uuid';
import { join, basename } from 'path';
import { readdirSync, writeFileSync } from 'fs';

const tar = require('tar');
const tmp = require('tmp');

tmp.setGracefulCleanup();

export const testFileName = `dummy-${uuidv4()}`;
const testDir = tmp.dirSync({ unsafeCleanup: true });

export function getTestDirPath(): string {
  return testDir.name;
}

export function getTestFilePath(): string {
  return join(testDir.name, testFileName);
}

export async function prepareTestFile(): Promise<void> {
  writeFileSync(getTestFilePath(), 'test');
}

export async function listFileNamesInTestDir(): Promise<Array<string>> {
  return readdirSync(getTestFilePath());
}

export async function createFileBackup(fileName: string): Promise<string> {
  await prepareTestFile();

  const backupedFilePath = join(getTestFilePath(), `${fileName}.tar.gz`);

  tar.c(
    {
      sync: true,
      gzip: true,
      file: backupedFilePath,
      cwd: getTestFilePath(),
    },
    [basename(getTestFilePath())],
  );

  return backupedFilePath;
}

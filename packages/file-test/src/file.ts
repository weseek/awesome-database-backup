import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { readdirSync, writeFileSync } from 'fs';
import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import tempDir from './temp-dir';

const tar = require('tar');
const tmp = require('tmp');

const exec = promisify(execOriginal);

export const testFileName = `dummy-${uuidv4()}`;

export async function clearTestDir(): Promise<void> {
  tempDir.clean();
}

export function getTestDirPath(): string {
  return tempDir.tmpdir.name;
}

export function getTestFilePath(): string {
  return join(getTestDirPath(), testFileName);
}

export async function prepareTestFile(): Promise<void> {
  writeFileSync(getTestFilePath(), 'test');
}

export async function prepareLargeTestFile(sizeInMB = 256): Promise<void> {
  const filePath = getTestFilePath();
  await exec(`dd if=/dev/random of=${filePath} bs=1M count=${sizeInMB}`);
}

export async function listFileNamesInTestDir(): Promise<Array<string>> {
  return readdirSync(getTestDirPath());
}

export async function createFileBackup(fileName: string): Promise<string> {
  const tmpdir = tmp.dirSync({ unsafeCleanup: true });
  writeFileSync(join(tmpdir.name, 'dummy'), 'test');

  const backupedFilePath = join(tmpdir.name, `${fileName}.tar.gz`);

  tar.c(
    {
      sync: true,
      gzip: true,
      file: backupedFilePath,
      cwd: tmpdir.name,
    },
    ['dummy'],
  );

  return backupedFilePath;
}

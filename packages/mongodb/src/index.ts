import { exec } from 'child_process';
import { dirname, basename } from 'path';

export function backup(destinationPath: string, mongodumpRequiredOptions?: Record<string, string>): void {
  const defaultMongodumpOptions: Record<string, string> = {};
  const outputOption: Record<string, string> = { '-o': destinationPath };
  // [TODO] block "--output" option
  // [TODO] block injection string
  const mongodumpOptions: Record<string, string> = {
    ...defaultMongodumpOptions,
    ...mongodumpRequiredOptions,
    ...outputOption,
  };

  const backupCommand = 'mongodump';
  const optionsString = Object.keys(mongodumpOptions).map((key: string) => (mongodumpOptions[key] ? [key, mongodumpOptions[key]].join('=') : key)).join(' ');
  exec(`${backupCommand} ${optionsString}`);
}

export async function compress(compressTargetPath: string): Promise<Record<string, string>> {
  const compressedFilePath = `${compressTargetPath}.tar.gz`;
  const defaultTarOption = {
    '-j': '',
    '-c': '',
    '-v': '',
    '-f': compressedFilePath,
    '-C': dirname(compressedFilePath),
  };
  const tarOptions: Record<string, string> = {
    ...defaultTarOption,
  };
  const compressCommand = 'tar';
  const optionsString = Object.keys(tarOptions).map((key: string) => (tarOptions[key] ? [key, tarOptions[key]].join(' ') : key)).join(' ');
  const valuesString = basename(compressTargetPath);
  console.log(`${compressCommand} ${optionsString} ${valuesString}`);
  await exec(`${compressCommand} ${optionsString} ${valuesString}`);
  return { compressedFilePath };
}

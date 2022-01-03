import { exec } from 'child_process';
import { dirname, basename } from 'path';

export async function backup(destinationPath: string, mongodumpRequiredOptions?: Record<string, string>): Promise<void> {
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
  return new Promise((resolve, reject) => {
    exec(`${backupCommand} ${optionsString}`, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
  });

}

export async function compress(compressTargetPath: string): Promise<Record<string, string>> {
  const compressedFilePath = `${compressTargetPath}.tar.bz`;
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
  return new Promise((resolve, reject) => {
    exec(`${compressCommand} ${optionsString} ${valuesString}`, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve({ compressedFilePath });
    });
  });
}

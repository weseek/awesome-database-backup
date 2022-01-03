import { exec } from 'child_process';
import { dirname, basename } from 'path';

export async function compress(compressTargetPath: string): Promise<Record<string, string>> {
  const compressedFilePath = `${compressTargetPath}.tar.bz2`;
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

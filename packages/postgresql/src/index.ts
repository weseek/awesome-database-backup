import { exec } from 'child_process';
import { dirname, basename } from 'path';

const kebabCase = require('kebab-case');

export function convertOption(awesomeBackupOption: Record<string, string>): Record<string, string> {
  const pgtoolOption: Record<string, string> = {};

  Object.keys(awesomeBackupOption)
    .filter(key => key.match(/^postgresql[A-Z]/))
    .forEach((key) => {
      const pgtoolKey = `--${kebabCase(key).replace(/^postgresql-/g, '')}`;
      pgtoolOption[pgtoolKey] = awesomeBackupOption[key];
    });
  return pgtoolOption;
}

export async function backup(destinationPath: string, pgdumpRequiredOptions?: Record<string, string>): Promise<void> {
  const defaultPGdumpOptions: Record<string, string> = {};
  const outputOption: Record<string, string> = { '--file': destinationPath };
  // [TODO] block "--file" option
  // [TODO] block injection string
  const pgdumpOptions: Record<string, string> = {
    ...defaultPGdumpOptions,
    ...pgdumpRequiredOptions,
    ...outputOption,
  };

  const backupCommand = 'pg_dump';
  const optionsString = Object.keys(pgdumpOptions).map((key: string) => (pgdumpOptions[key] ? [key, pgdumpOptions[key]].join('=') : key)).join(' ');
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

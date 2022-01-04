import { exec } from 'child_process';

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

export function backup(destinationPath: string, pgdumpRequiredOptions?: Record<string, string>): Promise<void> {
  const backupCommand = 'pg_dumpall';
  const defaultPGdumpOptions: Record<string, string> = {
  };
  const outputOption: Record<string, string> = {
    '--file': destinationPath,
  };
  // [TODO] block "--file" option
  // [TODO] block injection string
  const pgdumpOptions: Record<string, string> = {
    ...defaultPGdumpOptions,
    ...pgdumpRequiredOptions,
    ...outputOption,
  };

  const optionsString = Object.keys(pgdumpOptions).map((key: string) => (pgdumpOptions[key] ? [key, pgdumpOptions[key]].join('=') : key)).join(' ');
  return new Promise((resolve, reject) => {
    exec(`${backupCommand} ${optionsString}`, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      console.log(stdout);
      console.error(stderr);
      resolve();
    });
  });
}

export function restore(sourcePath: string, pgrestoreRequiredOptions?: Record<string, string>): Promise<void> {
  const restoreCommand = 'psql';
  const defaultPGdumpOptions: Record<string, string> = {};
  const inputOption: Record<string, string> = {
    '--file': sourcePath,
  };
  // [TODO] block "--file" option
  // [TODO] block injection string
  const pgdumpOptions: Record<string, string> = {
    ...defaultPGdumpOptions,
    ...pgrestoreRequiredOptions,
    ...inputOption,
  };

  const optionsString = Object.keys(pgdumpOptions).map((key: string) => (pgdumpOptions[key] ? [key, pgdumpOptions[key]].join('=') : key)).join(' ');
  return new Promise((resolve, reject) => {
    exec(`${restoreCommand} ${optionsString}`, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      console.log(stdout);
      console.error(stderr);
      resolve();
    });
  });
}

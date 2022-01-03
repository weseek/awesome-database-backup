import { exec } from 'child_process';

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

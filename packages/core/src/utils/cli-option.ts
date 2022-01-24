
import { exec } from 'child_process';

export async function execute(
    command: string,
    args?: string,
    options?: string,
): Promise<Record<string, string>> {
  const commandParameterSeparator = ' '; // ex. 'command_name <options> arg1 arg2'

  const commandString = [command, options, args].join(commandParameterSeparator);
  return new Promise((resolve, reject) => {
    exec(commandString, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      return resolve({ stdout, stderr });
    });
  });
}

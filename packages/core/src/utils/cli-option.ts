
import { exec, ExecException } from 'child_process';

const kebabCase = require('kebab-case');

export function convertOption(option: Record<string, string|number|boolean>, prefix: string): Record<string, string> {
  const convertedOption: Record<string, string> = {};

  Object.keys(option)
    .filter(key => key.startsWith(prefix))
    .forEach((key) => {
      const convertedKey = `--${kebabCase(key).replace(new RegExp(`${prefix}-`, 'g'), '')}`;
      convertedOption[convertedKey] = option[key].toString();
    });
  return convertedOption;
}

export async function execute(
    command: string, args?: string[], option?: Record<string, string>, defaultOption?: Record<string, string>
): Promise<string[]> {
  const mergedOption = { ...defaultOption, ...option };
  const optionsString = Object.keys(mergedOption).map((key: string) => (mergedOption[key] ? [key, mergedOption[key]].join(' ') : key)).join(' ');
  const argumentString = args?.join(' ');
  return new Promise((resolve, reject) => {
    exec(`${command} ${optionsString} ${argumentString}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      return resolve([stdout, stderr]);
    });
  });
}

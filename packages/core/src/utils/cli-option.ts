
import { exec } from 'child_process';

const kebabCase = require('kebab-case');

function _camelize(str: string) {
  return (str.charAt(0).toLowerCase() + str.slice(1)).replace(/[-_](.)/g, (match, firstLetterOfWord) => firstLetterOfWord.toUpperCase());
}

export function convertOption(
    option: Record<string, string|number|boolean|string[]|number[]>,
    filter: (key: string) => boolean,
    converter: (key: string) => string,
): Record<string, string|number|boolean|string[]|number[]> {
  const convertedOption: Record<string, string|number|boolean|string[]|number[]> = {};

  Object.keys(option)
    .filter(key => filter(key))
    .forEach((key) => {
      const convertedKey = converter(key);
      convertedOption[convertedKey] = Array.isArray(option[key]) ? option[key] : option[key].toString();
    });
  return convertedOption;
}

export function convertOptionAsKebabCase(
    option: Record<string, string|number|boolean|string[]|number[]>,
    prefix: string,
): Record<string, string|number|boolean|string[]|number[]> {
  return convertOption(
    option,
    (key: string) => kebabCase(key.startsWith(`${prefix}-`)),
    (key: string) => `--${kebabCase(key).replace(new RegExp(`${prefix}-`, 'g'), '')}`,
  );
}

export function convertOptionAsCamelCase(
    option: Record<string, string|number|boolean|string[]|number[]>,
    prefix: string,
): Record<string, string|number|boolean|string[]|number[]> {
  return convertOption(
    option,
    (key: string) => kebabCase(key).startsWith(`${prefix}-`),
    (key: string) => `--${_camelize(key.replace(new RegExp(`${prefix}`, 'g'), ''))}`,
  );
}

export async function execute(
    command: string,
    args?: string,
    options?: string,
): Promise<string[]> {
  const commandParameterSeparator = ' '; // ex. 'command_name <options> arg1 arg2'

  const commandString = [command, options, args].join(commandParameterSeparator);
  return new Promise((resolve, reject) => {
    exec(commandString, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      return resolve([stdout, stderr]);
    });
  });
}


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
    args?: string[],
    option?: Record<string, string|number|boolean|string[]|number[]>,
    defaultOption?: Record<string, string|number|boolean|string[]|number[]>,
    listValueEnabled = true,
): Promise<string[]> {
  const optionKVSeparator = ' '; // ex. '--opt1 value1'
  const commandParameterSeparator = ' '; // ex. 'command_name <options> arg1 arg2'

  const mergedOption = { ...defaultOption, ...option };
  const optionsString = Object
    .keys(mergedOption)
    .filter(key => mergedOption[key])
    .flatMap((key: string) => {
      /* boolean value
        ex. { '--key': true } will return '--key', { '--key': false } will return null */
      if (typeof mergedOption[key] === 'boolean') {
        if (mergedOption[key] === false) return null;

        return key;
      }
      /* array value
        ex. { '--key': ['value1', 'value2'] } will return '--key value1 value2' or ['--key value1', '--key value2'] */
      if (Array.isArray(mergedOption[key])) {
        const array = mergedOption[key] as [];
        return (listValueEnabled)
          ? [key].concat(array).join(optionKVSeparator)
          : array.map(val => [key, val].join(optionKVSeparator));
      }
      return [key, mergedOption[key]].join(optionKVSeparator);
    })
    .filter(kvs => kvs != null)
    .join(commandParameterSeparator);
  const argumentString = args?.join(commandParameterSeparator) || '';
  const commandString = [command, optionsString, argumentString].filter(str => str.length > 0).join(commandParameterSeparator);

  return new Promise((resolve, reject) => {
    exec(commandString, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      return resolve([stdout, stderr]);
    });
  });
}

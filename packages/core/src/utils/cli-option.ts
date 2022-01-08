
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

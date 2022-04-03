module.exports = {
  root: true, // https://eslint.org/docs/user-guide/configuring/configuration-files#cascading-and-hierarchy
  extends: [
    'weseek',
    'weseek/typescript',
    'plugin:jest/recommended',
  ],
  env: {
    'jest/globals': true,
  },
  globals: {
  },
  plugins: [
    'jest',
  ],
  rules: {
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        ArrayExpression: 'first',
        FunctionDeclaration: { body: 1, parameters: 2 },
        FunctionExpression: { body: 1, parameters: 2 },
      },
    ],
    'jest/no-standalone-expect': [
      'error',
      { additionalTestBlockFunctions: ['each.test'] },
    ],
    'no-multi-str': 'off',
  },
  settings: {
    /**
     * Support paths defined in tsconfig.json
     * see. https://www.npmjs.com/package/eslint-import-resolver-typescript
     */
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        config: [
          'tsconfig.json',
        ],
      },
    },
  },
};

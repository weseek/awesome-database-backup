/* ref. https://jestjs.io/ja/docs/getting-started#babel-%E3%82%92%E4%BD%BF%E7%94%A8%E3%81%99%E3%82%8B */
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      }
    }],
    '@babel/preset-typescript',
  ],
};

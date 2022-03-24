module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/airbnb',
  ],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-restricted-syntax': 'off',
    'arrow-parens': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/extensions': 'off',
    'no-param-reassign': 'off',
    'no-plusplus': 'off',
    'array-callback-return': 'off',
    'class-methods-use-this': 'off',
    'no-bitwise': 'off',
  },
};

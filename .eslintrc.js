module.exports = {
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  parser: "@babel/eslint-parser",
  parserOptions: {
    requireConfigFile: false,
  },
  env: {
    es6: true,
    jest: true,
    browser: true,
    node: true,
  },
};

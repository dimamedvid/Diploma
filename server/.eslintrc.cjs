module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:jsdoc/recommended",
  ],
  plugins: ["jsdoc"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "script",
  },
  settings: {
    jsdoc: {
      mode: "jsdoc",
    },
  },
  rules: {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": "off",
    eqeqeq: ["error", "always"],
    curly: ["error", "all"],
    semi: ["error", "always"],
    quotes: ["error", "double"],
    indent: ["error", 2],
    "comma-dangle": ["error", "always-multiline"],
    "object-curly-spacing": ["error", "always"],

    "jsdoc/require-jsdoc": [
      "warn",
      {
        publicOnly: true,
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
        },
      },
    ],
    "jsdoc/require-param-description": "off",
    "jsdoc/require-returns-description": "off",
    "jsdoc/check-param-names": "warn",
    "jsdoc/check-tag-names": "warn",
    "jsdoc/check-alignment": "warn",
    "jsdoc/check-types": "off",
    "jsdoc/tag-lines": "off",
    "jsdoc/reject-function-type": "off",
    "jsdoc/valid-types": "off",
  },
  ignorePatterns: [
    "node_modules/",
    "coverage/",
    "data/",
    "docs/generated/",
  ],
  overrides: [
    {
      files: ["**/__tests__/**/*.js", "**/*.test.js"],
      rules: {
        "jsdoc/require-jsdoc": "off",
      },
    },
  ],
};
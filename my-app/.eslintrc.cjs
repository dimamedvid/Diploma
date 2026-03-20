module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:jsdoc/recommended",
  ],
  plugins: ["jsdoc"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
    jsdoc: {
      mode: "jsdoc",
    },
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",

    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": "warn",
    eqeqeq: ["error", "always"],
    curly: ["error", "all"],
    semi: ["error", "always"],
    quotes: ["error", "double"],
    indent: ["error", 2],
    "comma-dangle": ["error", "always-multiline"],
    "object-curly-spacing": ["error", "always"],
    "import/no-unresolved": "off",

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
    "jsdoc/no-undefined-types": "off",
  },
  ignorePatterns: [
    "dist/",
    "node_modules/",
    "public/",
    "coverage/",
    "*.config.js",
    "cucumber.js",
    "docs/generated/",
  ],
  overrides: [
    {
      files: ["**/__tests__/**/*.js", "**/*.test.js", "**/*.test.jsx"],
      env: {
        jest: true,
      },
      rules: {
        "jsdoc/require-jsdoc": "off",
      },
    },
  ],
};
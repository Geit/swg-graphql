import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, globalIgnores } from 'eslint/config';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import prettier from 'eslint-plugin-prettier';
import promise from 'eslint-plugin-promise';
import jest from 'eslint-plugin-jest';
import globals from 'globals';
import babelParser from '@babel/eslint-parser';
import typescriptEslintEslintPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(['**/*.d.ts', '**/.next', '**/public', '**/node_modules', '**/build', '**/*.generated.ts']),
  {
    extends: fixupConfigRules(
      compat.extends(
        'eslint:recommended',
        'prettier',
        'plugin:eslint-comments/recommended',
        'plugin:promise/recommended',
        'plugin:jest/recommended',
        'plugin:import/errors',
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended'
      )
    ),

    plugins: {
      prettier,
      promise: fixupPluginRules(promise),
      jest: fixupPluginRules(jest),
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.browser,
      },

      parser: babelParser,
      ecmaVersion: 2020,
      sourceType: 'module',

      parserOptions: {
        requireConfigFile: false,
      },
    },

    settings: {
      'import/resolver': {
        typescript: {},
      },
    },

    rules: {
      'eslint-comments/no-unused-disable': 'error',
      'jest/consistent-test-it': 'error',
      'jest/expect-expect': 'error',
      'jest/prefer-spy-on': 'error',
      'jest/prefer-to-contain': 'error',
      'jest/prefer-to-have-length': 'error',
      'array-callback-return': 'error',
      camelcase: 'error',
      'default-case': 'error',
      'dot-notation': 'error',

      eqeqeq: [
        'error',
        'always',
        {
          null: 'ignore',
        },
      ],

      'global-require': 'error',
      'handle-callback-err': 'error',
      'no-array-constructor': 'error',
      'no-buffer-constructor': 'error',
      'no-duplicate-imports': 'error',
      'no-else-return': 'error',
      'no-empty-function': 'error',
      'no-eval': 'error',
      'no-extra-bind': 'error',
      'no-floating-decimal': 'error',
      'no-implicit-coercion': 'error',
      'no-implied-eval': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-lonely-if': 'error',
      'no-multi-assign': 'error',
      'no-multi-str': 'error',
      'no-nested-ternary': 'error',
      'no-new-func': 'error',
      'no-new-object': 'error',
      'no-new-require': 'error',
      'no-new-wrappers': 'error',
      'no-new': 'error',

      'no-param-reassign': [
        'error',
        {
          props: true,
        },
      ],

      'no-path-concat': 'error',

      'no-plusplus': [
        'error',
        {
          allowForLoopAfterthoughts: true,
        },
      ],

      'no-proto': 'error',
      'no-return-assign': 'error',
      'no-return-await': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-shadow-restricted-names': 'error',
      'no-shadow': 'error',

      'no-undef': [
        'error',
        {
          typeof: true,
        },
      ],

      'no-undef-init': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unneeded-ternary': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-catch': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'no-var': 'error',
      'no-void': 'error',
      'no-with': 'error',
      'object-shorthand': 'error',
      'one-var': ['error', 'never'],
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'prefer-object-spread': 'error',
      'prefer-promise-reject-errors': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error',
      'prettier/prettier': 'error',
      'require-await': 'error',
      strict: 0,
      yoda: ['error', 'never'],
      'import/no-deprecated': 'error',
      'import/no-dynamic-require': 'error',
      'import/no-absolute-path': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',
      'import/no-unused-modules': 'error',
      'import/first': 'error',
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error',
      'import/extensions': 'error',
      'import/no-unresolved': ['error'],
      'import/named': 'off',

      'import/order': [
        'error',
        {
          'newlines-between': 'always',
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],

    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslintEslintPlugin),
    },

    languageOptions: {
      parser: tsParser,
    },

    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': ['error'],
    },
  },
]);

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      'airbnb',
      'airbnb-typescript',
      'airbnb/hooks',
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Airbnb overrides for your preferences
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/jsx-props-no-spreading': 'off', // Allow prop spreading
      'react/require-default-props': 'off', // Allow optional props
      'import/prefer-default-export': 'off', // Allow named exports
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
      'max-len': ['error', { code: 100, ignoreUrls: true }],
      'no-console': 'warn', // Warn about console.log usage
      'no-debugger': 'error',
    },
  },
])

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      // React Refresh rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Relaxed rules for existing codebase
      'no-console': 'off',                                      // Allow console logs for now
      'no-debugger': 'error',                                   // Keep this as error
      'max-len': 'off',                                         // Turn off line length checking
      '@typescript-eslint/no-unused-vars': 'off',               // Allow unused vars for now
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',              // Allow 'any' types for now
      '@typescript-eslint/no-require-imports': 'off',           // Allow require() in tests
      '@typescript-eslint/no-unsafe-function-type': 'off',      // Allow Function type
      'no-case-declarations': 'off',                            // Allow case block declarations
      'react-hooks/exhaustive-deps': 'off',                     // Turn off for now - can break working code
    },
  }
)

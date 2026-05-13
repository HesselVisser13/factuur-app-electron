import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

export default defineConfig(
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/out',
      '**/release',
      'src/generated/**',
      'prisma/migrations/**'
    ]
  },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,

      // React 19 / react-hooks v7 rules: te streng voor onze patterns
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/incompatible-library': 'off',

      // Provider + hook combo files (Toast, ConfirmDialog) zijn standaard pattern
      'react-refresh/only-export-components': 'off',

      // Globaal uit: TypeScript leidt return types prima af.
      // Voor pure utility/service .ts files zetten we 'm hieronder weer aan.
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  },
  {
    // Voor utility/IPC/hook .ts files (geen JSX) wel expliciete return types,
    // omdat dat voor pure functies wel waarde toevoegt.
    files: [
      'src/main/ipc/**/*.ts',
      'src/main/services/mail/**/*.ts',
      'src/renderer/src/utils/**/*.ts',
      'src/renderer/src/hooks/**/*.ts',
      'src/shared/klant-utils.ts',
      'src/shared/mail-types.ts',
      'src/shared/types.ts',
      'src/main/logger.ts',
      'src/main/config.ts',
      'src/main/paths.ts'
    ],
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true
        }
      ]
    }
  },
  eslintConfigPrettier
)

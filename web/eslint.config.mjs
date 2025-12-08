import nextPlugin from 'eslint-config-next'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'dist/**'],
  },
  ...nextPlugin(),
  {
    rules: {
      curly: ['error', 'multi-line'],
      'no-console': 'warn',
    },
  },
  eslintConfigPrettier,
]

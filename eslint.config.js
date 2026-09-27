import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 네이티브 프로젝트와 빌드 산출물은 검사 대상이 아니다. cap sync가 복사해 넣은
  // minify된 번들과 Gradle 배포판에 딸려온 문서용 JS까지 린트해서 문제가 2000건 넘게
  // 잡히고 있었다 — 전부 .gitignore에 있는, 커밋되지도 않는 파일이다.
  globalIgnores(['dist', 'build', 'ios', 'android', 'public']),
  // 설정 파일은 Node에서 돈다 — process.cwd()를 브라우저 전역으로만 검사하면 no-undef가 난다.
  {
    files: ['*.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])

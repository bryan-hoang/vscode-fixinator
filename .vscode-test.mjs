import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'dist/tests/**/*.test.js',
  // To register & autodetect `cfml` file types.
  installExtensions: ['cfmleditor.cfmleditor'],
  workspaceFolder: './src/tests/fixtures',
  mocha: {
		// Default is 2000.
    timeout: 30_000,
  },
});

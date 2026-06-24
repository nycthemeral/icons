import babel from '@rollup/plugin-babel';
import { defineConfig } from 'rollup';
import { glob } from 'glob';

const iconFiles = await glob('src/icons/*.tsx');

export default defineConfig([
  // CJS
  {
    input: iconFiles,
    output: {
      dir: 'dist/cjs/icons',
      format: 'cjs',
      exports: 'auto',
      preserveModules: true,
      preserveModulesRoot: 'src/icons',
      entryFileNames: '[name].js',
    },
    external: (id) => id.startsWith('solid-js') || id.includes('../Icon'),
    plugins: [
      babel({
        babelHelpers: 'bundled',
        presets: ['solid', '@babel/preset-typescript'],
        extensions: ['.ts', '.tsx'],
      }),
    ],
  },
  // ESM
  {
    input: iconFiles,
    output: {
      dir: 'dist/esm/icons',
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: 'src/icons',
      entryFileNames: '[name].mjs',
    },
    external: (id) => id.startsWith('solid-js') || id.includes('../Icon'),
    plugins: [
      babel({
        babelHelpers: 'bundled',
        presets: ['solid', '@babel/preset-typescript'],
        extensions: ['.ts', '.tsx'],
      }),
    ],
  },
]);

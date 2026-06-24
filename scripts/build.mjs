import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { rm, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';

async function clean() {
  await rm(DIST, { recursive: true, force: true });
}

async function buildTypes() {
  console.log('Building types...');
  execSync(
    'npx tsc --emitDeclarationOnly --declaration --outDir dist/types -p tsconfig.json',
    { stdio: 'inherit' }
  );
}

async function fixEsmExtensions(dir) {
  // Recursively add .mjs to relative imports in .mjs files
  const files = await readdir(dir, { withFileTypes: true });
  for (const f of files) {
    const p = join(dir, f.name);
    if (f.isDirectory()) {
      await fixEsmExtensions(p);
    } else if (f.name.endsWith('.mjs')) {
      let code = await readFile(p, 'utf8');
      // Fix relative imports that don't have extension
      code = code.replace(
        /from\s+["'](\.\.?\/[^"']+?)["']/g,
        (m, pth) => {
          if (pth.endsWith('.mjs') || pth.endsWith('.js')) return m;
          return `from "${pth}.mjs"`;
        }
      );
      await writeFile(p, code);
    }
  }
}

async function buildSourceJsx() {
  console.log('Building dist/source (JSX preserve for Solid)...');
  await build({
    entryPoints: [
      './src/icons/*.tsx',
      './src/icons/index.ts',
      './src/index.ts',
      './src/Icon.tsx',
      './src/defaultAttributes.ts',
      './src/types.ts'
    ],
    outdir: 'dist/source',
    outExtension: { '.js': '.jsx' },
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    jsx: 'preserve',
    jsxImportSource: 'solid-js',
    format: 'esm',
    bundle: false,
    splitting: false,
    sourcemap: false,
  });
}

async function buildEsm() {
  console.log('Building dist/esm...');
  await build({
    entryPoints: [
      './src/icons/*.tsx',
      './src/icons/index.ts',
      './src/index.ts',
      './src/Icon.tsx',
      './src/defaultAttributes.ts',
      './src/types.ts'
    ],
    outdir: 'dist/esm',
    outExtension: { '.js': '.mjs' },
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    format: 'esm',
    bundle: false,
    splitting: false,
    sourcemap: false,
  });

  // Fix relative imports for Node ESM compatibility
  await fixEsmExtensions(join(DIST, 'esm'));

  // Fix root barrel to point to the icons barrel (so `import { Name } from "pkg"` works)
  const rootEsm = join(DIST, 'esm', 'index.mjs');
  let rootCode = await readFile(rootEsm, 'utf8');
  rootCode = rootCode.replace(/export \* from "\.\/icons\.mjs";/g, 'export * from "./icons/index.mjs";');
  rootCode = rootCode.replace(/export \* from "\.\/icons";/g, 'export * from "./icons/index.mjs";');
  await writeFile(rootEsm, rootCode);

  const rootSource = join(DIST, 'source', 'index.jsx');
  let rootSourceCode = await readFile(rootSource, 'utf8');
  rootSourceCode = rootSourceCode.replace(/export \* from "\.\/icons";/g, 'export * from "./icons/index.jsx";');
  await writeFile(rootSource, rootSourceCode);
}

async function buildCjs() {
  console.log('Building dist/cjs...');
  await build({
    entryPoints: [
      './src/icons/*.tsx',
      './src/icons/index.ts',
      './src/index.ts',
      './src/Icon.tsx',
      './src/defaultAttributes.ts',
      './src/types.ts'
    ],
    outdir: 'dist/cjs',
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    format: 'cjs',
    bundle: false,
    splitting: false,
    sourcemap: false,
  });

  // Fix root barrel to point to the icons barrel (so `const { Name } = require("pkg")` works)
  const rootCjs = join(DIST, 'cjs', 'index.js');
  let rootCode = await readFile(rootCjs, 'utf8');
  rootCode = rootCode.replace(/require\("\.\/icons"\)/g, 'require("./icons/index.js")');
  await writeFile(rootCjs, rootCode);
}

async function main() {
  console.log('Starting build...');
  await clean();
  await mkdir(DIST, { recursive: true });

  await buildTypes();
  await buildSourceJsx();
  await buildEsm();
  await buildCjs();

  console.log('Build complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

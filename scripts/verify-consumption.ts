/**
 * Smoke test for the built package.
 *
 * We manually satisfy the relative import that the generated icons have
 * (`import Icon from "../Icon"`), then import the icon modules and verify
 * they export a function (i.e. a Solid component).
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ESM_DIR = join(__dirname, '..', 'dist', 'esm');

const testIcons = ['AArrowDown', 'Abacus', 'Access'];

async function main() {
  console.log('Running smoke test for icon consumption...\n');

  // Pre-load the shared Icon renderer so relative imports in icons succeed
  await import(join(ESM_DIR, 'Icon.mjs'));

  let passed = 0;

  for (const name of testIcons) {
    try {
      const mod = await import(join(ESM_DIR, 'icons', `${name}.mjs`));
      const IconComponent = mod.default;

      const isFunction = typeof IconComponent === 'function';
      const status = isFunction ? 'OK' : 'FAIL';

      console.log(`${name}: ${status} (type=${typeof IconComponent})`);

      if (isFunction) {
        passed++;
      } else {
        console.error(`  Expected function, got ${typeof IconComponent}`);
      }
    } catch (err: any) {
      console.error(`${name}: ERROR - ${err.message}`);
    }
  }

  console.log(`\n${passed}/${testIcons.length} icons passed smoke test.`);

  if (passed !== testIcons.length) {
    console.error('Smoke test FAILED');
    process.exit(1);
  }

  console.log('Smoke test PASSED ✓');
}

main();

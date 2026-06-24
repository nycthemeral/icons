# @nycthemeral/icons

Custom icon set for SolidJS. Each icon is a standalone Solid component generated from raw SVG files.

**Consumer usage (the simple part):**

```tsx
import { AArrowDown, Abacus, Access } from '@nycthemeral/icons';

export function MyComponent() {
  return (
    <button class={styles.button}>
      <AArrowDown class={styles.icon} />
      Click me
    </button>
  );
}
```

- Plain named imports
- Works great with CSS Modules (`class={styles.xxx}`)
- Styling (size, color, stroke width, etc.) is done **exclusively** via CSS classes
- Only the `class` prop is accepted for styling; it is forwarded to the `<svg>`
- Only the icons you import end up in your bundle (tree-shaking works)

## How to add a new icon

1. Drop the new `.svg` file into the `icons/` folder (PascalCase name recommended, e.g. `NewThing.svg`).
2. Run the generator:

   ```bash
   pnpm generate
   ```

3. The new component is now available:

   ```tsx
   import { NewThing } from '@nycthemeral/icons';
   ```

The raw SVGs in `icons/` are the single source of truth.

## Development

```bash
# Generate components from SVGs
pnpm generate

# Full build (generate + bundle)
pnpm build

# Type check
pnpm typecheck
```

## Architecture

- One tiny generated `.tsx` file per icon (just the path data + a wrapper).
- Minimal shared `Icon` renderer: only forwards `class` to the `<svg>` and renders the data paths.
- All styling (size, color, stroke, etc.) is done exclusively via CSS classes.
- Package uses subpath exports (`./icons/*`) + `"sideEffects": false` so bundlers (Vite/Rollup) can eliminate unused icons.
- Output formats:
  - `dist/source/*.jsx` — JSX preserved for Solid compiler
  - `dist/esm/*.mjs`
  - `dist/types/` — TypeScript declarations

Generated files (`src/icons/`) are produced on demand and are not committed.

## Styling

Styling is done **exclusively** through CSS classes. The component accepts only a single optional `class` prop, which is applied to the root `<svg>`.

```tsx
import { AArrowDown } from '@nycthemeral/icons';

<AArrowDown class={styles.icon} />
```

All visual attributes must be set in CSS:

```css
.icon {
  width: 20px;
  height: 20px;
  color: currentColor;
  stroke-width: 2;
}
```

The generated `<svg>` elements always include these base attributes:

- `viewBox="0 0 20 20"`
- `fill="none"`

No size, color, strokeWidth, or other presentation props are supported.

## Why this shape?

We want the simplest possible import experience (`import { IconName } from '@nycthemeral/icons'`) combined with the smallest possible production bundles. Styling is done exclusively through CSS classes.

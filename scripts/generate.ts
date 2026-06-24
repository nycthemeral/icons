import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'icons');
const OUTPUT_DIR = join(__dirname, '..', 'src', 'icons');

type IconData = [elementName: string, attrs: Record<string, string>][];

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  // Match key="value" or key='value'
  const attrRegex = /([a-zA-Z0-9-]+)\s*=\s*["']([^"']*)["']/g;
  let match;
  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function parseSvgChildren(svgContent: string): IconData {
  const iconData: IconData = [];

  // Extract everything between <svg ...> and </svg>
  const svgMatch = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (!svgMatch) {
    throw new Error('Invalid SVG: no <svg> element found');
  }

  const inner = svgMatch[1];

  // Match all direct child elements (self-closing or not, but our SVGs are self-closing)
  // We look for <tag ... /> or <tag ...> ... </tag> but for these icons it's flat self-closing.
  const tagRegex = /<([a-zA-Z]+)([^>]*)\/?>/g;
  let tagMatch;

  while ((tagMatch = tagRegex.exec(inner)) !== null) {
    const tagName = tagMatch[1].toLowerCase();
    // Skip svg itself if somehow captured
    if (tagName === 'svg') continue;

    const attrString = tagMatch[2] || '';
    const attrs = parseAttributes(attrString);

    // Normalize some common attributes that might be numeric in source
    iconData.push([tagName, attrs]);
  }

  return iconData;
}

function generateIconFile(componentName: string, iconData: IconData): string {
  const iconDataJson = JSON.stringify(iconData, null, 2);

  // CSS-only: the component only accepts class for styling.
  // All other styling (size, color, stroke, etc.) must come from CSS classes.
  return `import Icon from '../Icon';
import type { IconData } from '../types';
import type { JSX } from 'solid-js';

const data: IconData = ${iconDataJson};

/**
 * @component @name ${componentName}
 */
const ${componentName} = (props: JSX.SvgSVGAttributes<SVGSVGElement> = {}) => Icon({ ...props, data });

export default ${componentName};

`;
}

async function generate() {
  console.log('Reading icons from:', ICONS_DIR);

  const files = await readdir(ICONS_DIR);
  const svgFiles = files.filter((f) => f.endsWith('.svg')).sort();

  console.log(`Found ${svgFiles.length} SVG files`);

  await mkdir(OUTPUT_DIR, { recursive: true });

  const exports: string[] = [];

  for (const file of svgFiles) {
    const componentName = basename(file, '.svg'); // Already PascalCase
    const svgPath = join(ICONS_DIR, file);

    const svgContent = await readFile(svgPath, 'utf-8');

    let iconData: IconData;
    try {
      iconData = parseSvgChildren(svgContent);
    } catch (err) {
      console.error(`Failed to parse ${file}:`, err);
      continue;
    }

    if (iconData.length === 0) {
      console.warn(`Warning: No elements found in ${file}`);
      continue;
    }

    const fileContent = generateIconFile(componentName, iconData);
    const outPath = join(OUTPUT_DIR, `${componentName}.tsx`);

    await writeFile(outPath, fileContent, 'utf-8');

    exports.push(`export { default as ${componentName} } from './${componentName}';`);
  }

  // Write the index
  const indexContent = exports.join('\n') + '\n';
  await writeFile(join(OUTPUT_DIR, 'index.ts'), indexContent, 'utf-8');

  console.log(`Generated ${exports.length} icon components`);
  console.log('Wrote index.ts with exports');

  // Generate a simple vanilla HTML gallery for easy lookup
  const galleryHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>@nycthemeral/icons Gallery</title>
  <style>
    :root {
      --bg: #f8fafc; --surface: #ffffff; --text: #0f172a; --muted: #64748b; --primary: #6366f1;
    }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; }
    h1 { text-align: center; color: #a855f7; }
    .search { display: block; margin: 0 auto 2rem; padding: 0.75rem 1rem; width: 100%; max-width: 400px; border-radius: 99px; border: 1px solid #cbd5e1; background: var(--surface); color: var(--text); font-size: 1rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
    .search:focus { outline: 2px solid var(--primary); border-color: transparent; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 1.5rem; }
    .card { background: var(--surface); border-radius: 12px; padding: 1.5rem 1rem; text-align: center; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border-color: #cbd5e1; }
    .card img { width: 32px; height: 32px; margin-bottom: 0.75rem; }
    .card span { display: block; font-size: 0.75rem; color: var(--text); word-break: break-all; font-weight: 500; }
    #toast { position: fixed; bottom: 2rem; right: 2rem; background: var(--primary); color: white; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 1000; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <h1>Icon Gallery</h1>
  <input type="text" class="search" id="search" placeholder="Search ${svgFiles.length} icons..." />
  <div class="grid" id="grid"></div>
  <div id="toast">Copied!</div>
  <script>
    const icons = ${JSON.stringify(svgFiles.map(f => basename(f, '.svg')))};
    const grid = document.getElementById('grid');
    const search = document.getElementById('search');
    const toast = document.getElementById('toast');
    let toastTimeout;

    window.copyIcon = function(name) {
      navigator.clipboard.writeText(name);
      toast.textContent = \`Copied \${name}!\`;
      toast.style.opacity = '1';
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => toast.style.opacity = '0', 2000);
    };

    function render(filter = '') {
      const term = filter.toLowerCase();
      let html = '';
      let count = 0;
      for (const name of icons) {
        if (!name.toLowerCase().includes(term)) continue;
        if (count++ > 500) break; // limit to 500 for performance
        html += \`<div class="card" onclick="copyIcon('\${name}')" title="Copy \${name}">
          <img loading="lazy" src="icons/\${name}.svg" alt="\${name}" />
          <span>\${name}</span>
        </div>\`;
      }
      grid.innerHTML = html;
    }

    search.addEventListener('input', (e) => render(e.target.value));
    render(); // Initial render
  </script>
</body>
</html>
  `.trim();
  
  await writeFile(join(__dirname, '..', 'gallery.html'), galleryHtml, 'utf-8');
  console.log('Generated gallery.html for easy lookups!');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});

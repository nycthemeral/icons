import type { SVGAttributes } from './types';

// Only structural attributes. All presentation (color, stroke-width, size, etc.)
// must come from CSS classes. No inline styling.
const defaultAttributes: SVGAttributes = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'none',
};

export default defaultAttributes;

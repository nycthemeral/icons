import { For, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import defaultAttributes from './defaultAttributes';
import type { IconData } from './types';

// Dumb passthrough.
// Accepts the icon data and a class string (for CSS Modules).
// No "props" for styling — size, color, stroke etc. must come from CSS classes.
// This keeps the API minimal and bundle size tiny.
const Icon = (props: JSX.SvgSVGAttributes<SVGSVGElement> & { data?: IconData }) => {
  const [local, rest] = splitProps(props, ['class', 'data']);

  return (
    <svg {...defaultAttributes} {...rest} class={local.class}>
      <For each={local.data}>
        {([el, a]) => <Dynamic component={el} {...a} />}
      </For>
    </svg>
  );
};

export default Icon;

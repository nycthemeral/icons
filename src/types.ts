import { JSX } from 'solid-js/jsx-runtime';

export type IconData = [elementName: keyof JSX.IntrinsicElements, attrs: Record<string, string>][];

export type SVGAttributes = Partial<JSX.SvgSVGAttributes<SVGSVGElement>>;

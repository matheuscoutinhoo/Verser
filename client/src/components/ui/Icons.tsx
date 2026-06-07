import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function baseProps({ size = 16, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
    focusable: false as const,
    ...rest,
  };
}

export const PenIcon = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="M11.5 2.5 13.5 4.5l-8 8L3 13l.5-2.5 8-8Z" />
    <path d="M10 4l2 2" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="M3 4h10" />
    <path d="M6 4V2.5h4V4" />
    <path d="M4.5 4 5 13.5h6L11.5 4" />
  </svg>
);

export const UploadIcon = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="M8 11V3" />
    <path d="m4.5 6.5 3.5-3.5 3.5 3.5" />
    <path d="M3 13.5h10" />
  </svg>
);

export const SparkleIcon = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="M8 2 9.2 6.8 14 8l-4.8 1.2L8 14 6.8 9.2 2 8l4.8-1.2L8 2Z" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="M8 3v10" />
    <path d="M3 8h10" />
  </svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="M3 8h10" />
    <path d="m9 4 4 4-4 4" />
  </svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="m10 3-5 5 5 5" />
  </svg>
);

export const ChevronUpIcon = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="m3 10 5-5 5 5" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="m3 6 5 5 5-5" />
  </svg>
);

export const XIcon = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="m4 4 8 8" />
    <path d="m12 4-8 8" />
  </svg>
);

export const MoreIcon = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <circle cx="3.5" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const ImageIcon = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <rect x="2" y="3" width="12" height="10" rx="1.5" />
    <circle cx="6" cy="7" r="1.25" />
    <path d="m3 12 3.5-3.5 2.5 2.5L11 8l2 2" />
  </svg>
);

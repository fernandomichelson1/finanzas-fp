import type { FC, SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

const base =
  (children: React.ReactNode, defaults?: Partial<IconProps>): FC<IconProps> =>
  ({ size = 22, ...rest }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...defaults}
      {...rest}
    >
      {children}
    </svg>
  );

const s = (props: SVGProps<SVGPathElement>) => (
  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props} />
);

export const Icon = {
  home: base(s({ d: 'M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z', strokeWidth: 1.8 })),
  list: base(s({ d: 'M4 6h16M4 12h16M4 18h10', strokeWidth: 1.8 })),
  chart: base(s({ d: 'M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-7', strokeWidth: 1.8 })),
  piggy: base(
    <>
      {s({
        d: 'M19 11.5c0 4-3.6 6.5-7.5 6.5-1 0-2-.2-2.9-.5L6 19v-2.7C4.8 15.2 4 13.5 4 11.5 4 7.5 7.6 5 11.5 5S19 7.5 19 11.5z',
        strokeWidth: 1.7,
      })}
      <circle cx="14" cy="11" r="1" fill="currentColor" />
    </>,
  ),
  more: base(
    <>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" />
    </>,
  ),
  dotsV: base(
    <>
      <circle cx="12" cy="5" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="19" r="1.6" fill="currentColor" />
    </>,
  ),
  plus: base(s({ d: 'M12 5v14M5 12h14', strokeWidth: 2.4 })),
  up: base(s({ d: 'M7 17L17 7M17 7H9M17 7v8', strokeWidth: 2 })),
  down: base(s({ d: 'M17 7L7 17M7 17h8M7 17V9', strokeWidth: 2 })),
  search: base(
    <>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      {s({ d: 'M21 21l-4-4', strokeWidth: 1.8 })}
    </>,
  ),
  filter: base(s({ d: 'M4 6h16M7 12h10M10 18h4', strokeWidth: 1.8 })),
  bell: base(
    <>
      {s({ d: 'M6 16V11a6 6 0 1112 0v5l1.5 2h-15L6 16z', strokeWidth: 1.7 })}
      {s({ d: 'M10 21a2 2 0 004 0', strokeWidth: 1.7 })}
    </>,
  ),
  chev: base(s({ d: 'M9 6l6 6-6 6', strokeWidth: 2 })),
  back: base(s({ d: 'M15 6l-6 6 6 6', strokeWidth: 2 })),
  close: base(s({ d: 'M6 6l12 12M18 6L6 18', strokeWidth: 2 })),
  check: base(s({ d: 'M5 12l5 5L20 7', strokeWidth: 2.4 })),
  warn: base(
    <>
      {s({ d: 'M12 3l10 18H2L12 3z', strokeWidth: 1.7 })}
      {s({ d: 'M12 10v4M12 17.5v.1', strokeWidth: 1.8 })}
    </>,
  ),
  edit: base(
    <>
      {s({ d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', strokeWidth: 2 })}
      {s({ d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z', strokeWidth: 2 })}
    </>,
  ),
  trash: base(
    <>
      {s({ d: 'M3 6h18', strokeWidth: 2 })}
      {s({ d: 'M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6', strokeWidth: 2 })}
      {s({ d: 'M10 11v6M14 11v6', strokeWidth: 2 })}
      {s({ d: 'M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2', strokeWidth: 2 })}
    </>,
  ),
  pause: base(
    <>
      <rect x="6" y="5" width="4" height="14" stroke="currentColor" strokeWidth="2" rx="1" />
      <rect x="14" y="5" width="4" height="14" stroke="currentColor" strokeWidth="2" rx="1" />
    </>,
  ),
  refresh: base(
    <>
      {s({ d: 'M3 12a9 9 0 1 0 3-6.7L3 8', strokeWidth: 2 })}
      {s({ d: 'M3 3v5h5', strokeWidth: 2 })}
    </>,
  ),
  lock: base(
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      {s({ d: 'M8 11V8a4 4 0 018 0v3', strokeWidth: 1.8 })}
    </>,
  ),
  logout: base(
    <>
      {s({ d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', strokeWidth: 1.9 })}
      {s({ d: 'M16 17l5-5-5-5M21 12H9', strokeWidth: 1.9 })}
    </>,
  ),
  sun: base(
    <>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.9" />
      {s({ d: 'M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19', strokeWidth: 1.9 })}
    </>,
  ),
  moon: base(s({ d: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z', strokeWidth: 1.8 })),
  receipt: base(
    <>
      {s({ d: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3z', strokeWidth: 1.7 })}
      {s({ d: 'M9 8.5h6M9 12.5h6', strokeWidth: 1.7 })}
    </>,
  ),
  wallet: base(
    <>
      {s({ d: 'M3 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z', strokeWidth: 1.7 })}
      {s({ d: 'M3 10h18', strokeWidth: 1.7 })}
      <circle cx="16.5" cy="14" r="1" fill="currentColor" />
    </>,
  ),
  cog: base(
    <>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      {s({
        d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V15z',
        strokeWidth: 1.6,
      })}
    </>,
  ),
} satisfies Record<string, FC<IconProps>>;

export type IconName = keyof typeof Icon;

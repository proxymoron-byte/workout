import type { SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'stroke' | 'size'> {
  size?: number;
  stroke?: number;
}

function S({ size = 18, stroke = 1.7, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => (
  <S {...p}>
    <path d="M3.5 11 12 4l8.5 7" />
    <path d="M5.5 10v9.5h13V10" />
    <path d="M10 19.5v-5h4v5" />
  </S>
);
export const IconDumbbell = (p: IconProps) => (
  <S {...p}>
    <path d="M3 12h2" />
    <path d="M19 12h2" />
    <rect x="5" y="8.5" width="3" height="7" rx="1" />
    <rect x="16" y="8.5" width="3" height="7" rx="1" />
    <path d="M8 12h8" />
  </S>
);
export const IconBowl = (p: IconProps) => (
  <S {...p}>
    <path d="M3.5 11h17" />
    <path d="M4.5 11c.5 5 4 7.5 7.5 7.5s7-2.5 7.5-7.5" />
    <path d="M9 8c1-1.5 4-1.5 5 0" />
    <path d="M12 5.5c.6-.7 1.2-.5 1.5 0" />
  </S>
);
export const IconHeart = (p: IconProps) => (
  <S {...p}>
    <path d="M12 19.5s-7-4.2-7-9.2a4 4 0 0 1 7-2.6 4 4 0 0 1 7 2.6c0 5-7 9.2-7 9.2Z" />
  </S>
);
export const IconStethoscope = (p: IconProps) => (
  <S {...p}>
    <path d="M5 4v5a4 4 0 0 0 8 0V4" />
    <path d="M9 13v3a4 4 0 0 0 8 0v-1.5" />
    <circle cx="17" cy="11.5" r="2" />
  </S>
);
export const IconSettings = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" />
  </S>
);
export const IconExport = (p: IconProps) => (
  <S {...p}>
    <path d="M12 4v11" />
    <path d="M8 8l4-4 4 4" />
    <path d="M5 16v3.5h14V16" />
  </S>
);
export const IconPlus = (p: IconProps) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);
export const IconClose = (p: IconProps) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </S>
);
export const IconSearch = (p: IconProps) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.3-4.3" />
  </S>
);
export const IconBell = (p: IconProps) => (
  <S {...p}>
    <path d="M6 16.5h12L17 14V11a5 5 0 0 0-10 0v3l-1 2.5Z" />
    <path d="M10 19.5a2 2 0 0 0 4 0" />
  </S>
);
export const IconChevronRight = (p: IconProps) => (
  <S {...p}>
    <path d="m9 6 6 6-6 6" />
  </S>
);
export const IconChevronLeft = (p: IconProps) => (
  <S {...p}>
    <path d="m15 6-6 6 6 6" />
  </S>
);
export const IconCheck = (p: IconProps) => (
  <S {...p}>
    <path d="m5 12.5 4 4L19 7" />
  </S>
);
export const IconClock = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4.5l3 1.8" />
  </S>
);
export const IconPause = (p: IconProps) => (
  <S {...p}>
    <rect x="7" y="5" width="3.5" height="14" rx="1" />
    <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
  </S>
);
export const IconPlay = (p: IconProps) => (
  <S {...p}>
    <path d="M7 5v14l12-7L7 5Z" />
  </S>
);
export const IconExternal = (p: IconProps) => (
  <S {...p}>
    <path d="M14 5h5v5" />
    <path d="M19 5l-8 8" />
    <path d="M19 13v5.5h-14v-14H10" />
  </S>
);
export const IconFlame = (p: IconProps) => (
  <S {...p}>
    <path d="M12 4c1.5 3 4.5 4.5 4.5 8a4.5 4.5 0 1 1-9 0c0-2 1.5-3 2-4.5C10 5 12 4 12 4Z" />
    <path d="M11 14a2 2 0 0 0 2 2" />
  </S>
);

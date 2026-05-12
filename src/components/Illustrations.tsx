interface ArtProps {
  size?: number;
}

export const ArtFlame = ({ size = 96 }: ArtProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M52 14c2 8 13 13 13 25 0 12-8 21-19 21-10 0-19-7-19-19 0-7 4-11 6-15 2-3 3-7 2-11 4 2 7 5 9 9 1-3 3-6 8-10Z" />
    <path d="M48 38c-1 4-4 6-4 11 0 5 3 9 8 9" opacity=".6" />
    <path d="M61 32c1 2 1 3 0 5" opacity=".5" />
  </svg>
);

export const ArtDrop = ({ size = 96 }: ArtProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M50 12c-3 8-15 19-15 32a16 16 0 0 0 32 0c0-13-12-24-15-32-.5-1.2-1.5-1.2-2 0Z" />
    <path d="M40 38c0 6 3 11 8 12" opacity=".55" />
    <path d="M50 70v18M44 80c2 4 6 6 6 6M56 80c-2 4-6 6-6 6" opacity=".7" />
  </svg>
);

export const ArtFootprint = ({ size = 96 }: ArtProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M40 60c-3 8 1 16 9 16s12-7 11-16c-.6-5 1-10-1-15-2-6-7-9-12-7-6 2-7 10-7 14-.2 3-.2 5 0 8Z" />
    <circle cx="55" cy="22" r="3.5" />
    <circle cx="64" cy="28" r="3" />
    <circle cx="68" cy="38" r="2.6" />
    <circle cx="65" cy="48" r="2.4" />
  </svg>
);

export const ArtMoon = ({ size = 96 }: ArtProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M62 16c-15 4-26 17-26 33s12 30 28 32c-12-6-20-18-20-32 0-13 7-25 18-33Z" />
    <path d="M70 28c-3 1-5 4-5 7" opacity=".5" />
    <path d="M76 44c-2 1-3 3-3 5" opacity=".5" />
    <path d="M28 70c2 1 3 3 3 5M22 60c1 1 2 2 2 3" opacity=".4" />
  </svg>
);

export const ArtBand = ({ size = 120 }: ArtProps) => (
  <svg
    width={size}
    height={size * 0.5}
    viewBox="0 0 200 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 60c20-30 40 30 60 0s40-30 60 0 40 30 60 0" />
    <path d="M10 70c20-30 40 30 60 0s40-30 60 0 40 30 60 0" opacity=".4" />
  </svg>
);

export const BrandMark = ({ size = 22 }: ArtProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 14c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
    <path d="M4 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0" opacity=".5" />
  </svg>
);


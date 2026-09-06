import { forwardRef, type SVGProps } from 'react';

// Custom line-style furniture icons designed to match lucide-react look
// stroke=currentColor, strokeWidth=2, 24x24 viewBox
type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

const base = (path: React.ReactNode) =>
  forwardRef<SVGSVGElement, IconProps>(({ size = 24, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {path}
    </svg>
  ));

export const MirrorIcon = base(
  <>
    <rect x="7" y="2" width="10" height="18" rx="5" />
    <path d="M8 22h8" />
    <path d="M12 20v2" />
  </>
);

export const ChandelierIcon = base(
  <>
    <path d="M12 3v4" />
    <path d="M6 11c0-2 3-4 6-4s6 2 6 4" />
    <path d="M6 11h12" />
    <path d="M6 11l-2 4" />
    <path d="M12 11v4" />
    <path d="M18 11l2 4" />
    <circle cx="4" cy="17" r="2" />
    <circle cx="12" cy="17" r="2" />
    <circle cx="20" cy="17" r="2" />
    <circle cx="12" cy="3" r="1" />
  </>
);

export const PendantLampIcon = base(
  <>
    <path d="M12 2v6" />
    <path d="M7 14c0-3 2-6 5-6s5 3 5 6z" />
    <path d="M9 14h6" />
    <path d="M12 14v6" />
    <circle cx="12" cy="21" r="1" />
  </>
);

export const ToiletIcon = base(
  <>
    <path d="M5 4h14v6a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z" />
    <path d="M8 15l-1 6h10l-1-6" />
  </>
);

export const SinkIcon = base(
  <>
    <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
    <path d="M12 12V6a2 2 0 0 1 2-2h2" />
    <path d="M16 3v3" />
  </>
);

export const RadiatorIcon = base(
  <>
    <rect x="4" y="5" width="16" height="14" rx="1" />
    <path d="M8 5v14" />
    <path d="M12 5v14" />
    <path d="M16 5v14" />
    <path d="M4 8h-2" />
    <path d="M4 16h-2" />
  </>
);

export const FireplaceIcon = base(
  <>
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <rect x="7" y="10" width="10" height="11" />
    <path d="M12 13c-1 1-1 2 0 3 1-1 2-1 2-3 0-1-1-2-2-2z" />
    <path d="M3 8h18" />
  </>
);

export const PaintingIcon = base(
  <>
    <rect x="3" y="4" width="18" height="16" rx="1" />
    <circle cx="8" cy="10" r="2" />
    <path d="M21 16l-5-5-8 8" />
  </>
);

export const BarStoolIcon = base(
  <>
    <path d="M7 4h10l-1 6H8z" />
    <path d="M12 10v10" />
    <path d="M8 20h8" />
    <path d="M9 13h6" />
  </>
);

export const EaselIcon = base(
  <>
    <path d="M4 21l4-18" />
    <path d="M20 21l-4-18" />
    <path d="M6 14h12" />
    <rect x="7" y="4" width="10" height="8" />
  </>
);

export const DresserIcon = base(
  <>
    <rect x="3" y="4" width="18" height="16" rx="1" />
    <path d="M3 10h18" />
    <path d="M3 15h18" />
    <circle cx="9" cy="7" r=".5" fill="currentColor" />
    <circle cx="15" cy="7" r=".5" fill="currentColor" />
    <circle cx="9" cy="12.5" r=".5" fill="currentColor" />
    <circle cx="15" cy="12.5" r=".5" fill="currentColor" />
    <circle cx="9" cy="17.5" r=".5" fill="currentColor" />
    <circle cx="15" cy="17.5" r=".5" fill="currentColor" />
  </>
);

export const VanityIcon = base(
  <>
    <rect x="4" y="3" width="16" height="10" rx="1" />
    <path d="M4 13v8" />
    <path d="M20 13v8" />
    <path d="M4 21h16" />
    <path d="M9 17h6" />
  </>
);

export const OfficeChairIcon = base(
  <>
    <path d="M6 4h12v8H6z" />
    <path d="M12 12v5" />
    <path d="M7 20l5-3 5 3" />
    <path d="M6 20h12" />
  </>
);

export const PlantPotIcon = base(
  <>
    <path d="M12 12c-2-3-4-4-6-4 0 3 2 6 6 6" />
    <path d="M12 12c2-4 5-6 8-6 0 4-3 8-8 8" />
    <path d="M7 14h10l-1 7H8z" />
  </>
);

export const CurtainsIcon = base(
  <>
    <path d="M3 3h18" />
    <path d="M6 3c0 6 -1 12 -3 18 3 0 6 -2 6 -6V3" />
    <path d="M18 3c0 6 1 12 3 18 -3 0 -6 -2 -6 -6V3" />
  </>
);

export const FanIcon = base(
  <>
    <circle cx="12" cy="12" r="1.5" />
    <path d="M12 10c0-4-2-7-5-7 0 3 2 6 5 7z" />
    <path d="M14 12c4 0 7-2 7-5-3 0-6 2-7 5z" />
    <path d="M12 14c0 4 2 7 5 7 0-3-2-6-5-7z" />
    <path d="M10 12c-4 0-7 2-7 5 3 0 6-2 7-5z" />
    <path d="M12 21v-3" />
    <path d="M9 21h6" />
  </>
);

export const GiftBoxIcon = base(
  <>
    <rect x="3" y="8" width="18" height="13" rx="1" />
    <path d="M3 12h18" />
    <path d="M12 8v13" />
    <path d="M12 8c-2 0-4-1-4-3s2-2 3-1 1 4 1 4z" />
    <path d="M12 8c2 0 4-1 4-3s-2-2-3-1-1 4-1 4z" />
  </>
);

export const NightstandIcon = base(
  <>
    <rect x="4" y="5" width="16" height="14" rx="1" />
    <path d="M4 12h16" />
    <path d="M4 19v2" />
    <path d="M20 19v2" />
    <circle cx="12" cy="8.5" r=".5" fill="currentColor" />
    <circle cx="12" cy="15.5" r=".5" fill="currentColor" />
  </>
);

import type { Perk } from "@/lib/catalog/types";

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className ?? "hm-icon"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** The same arrow the landing page uses on its links and buttons. */
export function ArrowIcon({ className }: IconProps) {
  return (
    <svg className={className ?? "hm-arrow"} viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);
export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.4" />
  </Svg>
);
export const TruckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 6.5h11v10h-11zM13.5 10h4l3.5 3.5v3h-7.5z" />
    <circle cx="7" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </Svg>
);
export const HeartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z" />
  </Svg>
);
export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1-3.6 4-5.3 7.5-5.3s6.5 1.7 7.5 5.3" />
  </Svg>
);
export const CartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 4.5h2.3l2.2 10.7h10.3l2-7.7H6.3" />
    <circle cx="9" cy="19" r="1.5" />
    <circle cx="16.5" cy="19" r="1.5" />
  </Svg>
);
export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </Svg>
);
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Svg>
);
export const MinusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.5 12h13" />
  </Svg>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Svg>
);
export const VerifiedIcon = ({ className }: IconProps) => (
  <svg className={className ?? "hm-verified"} viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="7" fill="currentColor" />
    <path d="m4.8 8.2 2.2 2.2 4.2-4.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const StarIcon = ({ className }: IconProps) => (
  <svg className={className ?? "hm-star"} viewBox="0 0 20 20" aria-hidden="true">
    <path
      fill="currentColor"
      d="m10 1.8 2.5 5.3 5.7.8-4.1 4.1 1 5.8L10 15.1 4.9 17.8l1-5.8-4.1-4.1 5.7-.8z"
    />
  </svg>
);

const PERK_ICONS: Record<Perk["icon"], React.ReactNode> = {
  compare: (
    <>
      <path d="M12 4v16M7 20h10" />
      <path d="M5 7h14" />
      <path d="m5 7-2.5 6.5a3 3 0 0 0 5 0zM19 7l-2.5 6.5a3 3 0 0 0 5 0z" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4.5h2.3l2.2 10.7h10.3l2-7.7H6.3" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="16.5" cy="19" r="1.5" />
    </>
  ),
  truck: (
    <>
      <path d="M2.5 6.5h11v10h-11zM13.5 10h4l3.5 3.5v3h-7.5z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.3" />
      <path d="M8.3 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
      <path d="m16 3 3 3-3 3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5.5v6c0 4.5 3 8 7 9.5 4-1.5 7-5 7-9.5v-6z" />
      <path d="m9 12 2.2 2.2L15.2 10" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  headset: (
    <>
      <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
      <rect x="3" y="13.5" width="3.5" height="5.5" rx="1.5" />
      <rect x="17.5" y="13.5" width="3.5" height="5.5" rx="1.5" />
      <path d="M19 19c0 1.5-2 2.5-4.5 2.5" />
    </>
  ),
};

export const PerkIcon = ({ name, className }: IconProps & { name: Perk["icon"] }) => (
  <Svg className={className}>{PERK_ICONS[name]}</Svg>
);

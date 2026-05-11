type P = { size?: number };
const B = '#4d9fff';
const O = '#ff8519';

/* ── Canvas / Map ── */
export const IconMap = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="2.4" fill={B} />
    <circle cx="3" cy="3" r="1.6" fill={B} opacity=".8" />
    <circle cx="15" cy="3" r="1.6" fill={B} opacity=".8" />
    <circle cx="3" cy="15" r="1.6" fill={B} opacity=".8" />
    <circle cx="15" cy="15" r="1.6" fill={B} opacity=".8" />
    <line x1="4.1" y1="4.1" x2="7.3" y2="7.3" stroke={B} strokeWidth="1.2" strokeLinecap="round" />
    <line x1="13.9" y1="4.1" x2="10.7" y2="7.3" stroke={B} strokeWidth="1.2" strokeLinecap="round" />
    <line x1="4.1" y1="13.9" x2="7.3" y2="10.7" stroke={B} strokeWidth="1.2" strokeLinecap="round" />
    <line x1="13.9" y1="13.9" x2="10.7" y2="10.7" stroke={B} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/* ── AI / Circuit ── */
export const IconAI = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <polygon points="9,1.5 16,5.25 16,12.75 9,16.5 2,12.75 2,5.25"
      stroke={O} strokeWidth="1.3" fill="none" />
    <circle cx="9" cy="5.5" r="1.3" fill={O} />
    <circle cx="5" cy="12" r="1.1" fill={O} />
    <circle cx="13" cy="12" r="1.1" fill={O} />
    <line x1="9" y1="6.8" x2="5" y2="10.9" stroke={O} strokeWidth="1.1" strokeLinecap="round" />
    <line x1="9" y1="6.8" x2="13" y2="10.9" stroke={O} strokeWidth="1.1" strokeLinecap="round" />
    <line x1="5" y1="10.9" x2="13" y2="10.9" stroke={O} strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

/* ── Brain / Memory ── */
export const IconBrain = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M9 3.5C7 3.5 5.2 4.8 4.5 6.8C3.3 7 2.2 8 2.2 9.5C2.2 11.2 3.5 12.3 5 12.5C5.5 13.8 7 15 9 15C11 15 12.5 13.8 13 12.5C14.5 12.3 15.8 11.2 15.8 9.5C15.8 8 14.7 7 13.5 6.8C12.8 4.8 11 3.5 9 3.5Z"
      stroke={B} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
    <line x1="9" y1="3.5" x2="9" y2="15" stroke={B} strokeWidth="1" strokeDasharray="2 1.5" opacity=".7" />
    <path d="M6.5 7.5 Q5.5 9.5 6.5 11.5" stroke={B} strokeWidth="1.1" strokeLinecap="round" fill="none" />
    <path d="M11.5 7.5 Q12.5 9.5 11.5 11.5" stroke={B} strokeWidth="1.1" strokeLinecap="round" fill="none" />
  </svg>
);

/* ── Settings / Sliders ── */
export const IconSettings = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <line x1="2" y1="5" x2="16" y2="5" stroke={O} strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="6" cy="5" r="2.1" fill={O} />
    <line x1="2" y1="9" x2="16" y2="9" stroke={O} strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="12" cy="9" r="2.1" fill={O} />
    <line x1="2" y1="13" x2="16" y2="13" stroke={O} strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="7.5" cy="13" r="2.1" fill={O} />
  </svg>
);

/* ── Document / Prompt ── */
export const IconDoc = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M4 2H11.5L14 4.5V16H4V2Z" stroke={B} strokeWidth="1.3" strokeLinejoin="round" fill="none" />
    <path d="M11.5 2V4.5H14" stroke={B} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="6.5" y1="7.5" x2="11.5" y2="7.5" stroke={B} strokeWidth="1.2" strokeLinecap="round" />
    <line x1="6.5" y1="10" x2="11.5" y2="10" stroke={B} strokeWidth="1.2" strokeLinecap="round" />
    <line x1="6.5" y1="12.5" x2="9.5" y2="12.5" stroke={B} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/* ── Trash / Clear ── */
export const IconTrash = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <line x1="3" y1="5" x2="15" y2="5" stroke={O} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M7 5V3.5H11V5" stroke={O} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M4.5 5L5.2 15H12.8L13.5 5" stroke={O} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="7.5" y1="7.5" x2="7.5" y2="12.5" stroke={O} strokeWidth="1.1" strokeLinecap="round" />
    <line x1="10.5" y1="7.5" x2="10.5" y2="12.5" stroke={O} strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

/* ── Stop ── */
export const IconStop = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <rect x="3" y="3" width="12" height="12" rx="2.5" fill={O} opacity=".2" stroke={O} strokeWidth="1.3" />
    <rect x="6.5" y="6.5" width="5" height="5" rx="1" fill={O} />
  </svg>
);

/* ── Wand / Magic ── */
export const IconWand = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <line x1="10" y1="8" x2="3" y2="15" stroke={O} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M10.5 7.5L12 2L13.5 5.5L17 6L13.5 8.5L14.5 12L11.5 9.5L8 11L9.5 7.5L7 5L10.5 7.5Z"
      fill={O} stroke={O} strokeWidth="0.5" strokeLinejoin="round" />
  </svg>
);

/* ── Save / Disk ── */
export const IconSave = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M3 3H13L15 5V15H3V3Z" stroke={B} strokeWidth="1.3" strokeLinejoin="round" fill="none" />
    <rect x="6" y="3" width="5" height="4" rx="0.5" stroke={B} strokeWidth="1.1" fill="none" />
    <rect x="5" y="10" width="8" height="4" rx="0.8" stroke={B} strokeWidth="1.1" fill="none" />
    <line x1="8.5" y1="3.5" x2="8.5" y2="6.5" stroke={B} strokeWidth="1" strokeLinecap="round" />
  </svg>
);

/* ── Warning / Triangle ── */
export const IconWarn = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M9 2.5L16.5 15H1.5L9 2.5Z" stroke={O} strokeWidth="1.3" strokeLinejoin="round" fill="none" />
    <line x1="9" y1="8" x2="9" y2="11.5" stroke={O} strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="9" cy="13.5" r="0.8" fill={O} />
  </svg>
);

/* ── Terminal / CLI ── */
export const IconTerminal = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <rect x="2" y="3" width="14" height="12" rx="2" stroke={B} strokeWidth="1.3" fill="none" />
    <polyline points="5,7 8,9 5,11" stroke={B} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="9.5" y1="11" x2="13" y2="11" stroke={B} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/* ── Globe / Topology ── */
export const IconGlobe = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="6.5" stroke={B} strokeWidth="1.3" />
    <ellipse cx="9" cy="9" rx="3" ry="6.5" stroke={B} strokeWidth="1.1" />
    <line x1="2.5" y1="9" x2="15.5" y2="9" stroke={B} strokeWidth="1.1" strokeLinecap="round" />
    <line x1="3.5" y1="6" x2="14.5" y2="6" stroke={B} strokeWidth="0.9" strokeLinecap="round" opacity=".7" />
    <line x1="3.5" y1="12" x2="14.5" y2="12" stroke={B} strokeWidth="0.9" strokeLinecap="round" opacity=".7" />
  </svg>
);

/* ── Refresh ── */
export const IconRefresh = ({ size = 16 }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M13.5 8A5.5 5.5 0 1 1 10.5 2.9" stroke={B} strokeWidth="1.4" strokeLinecap="round" fill="none" />
    <polyline points="10.5,1 10.5,3.5 13,3.5" stroke={B} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Play ── */
export const IconPlay = ({ size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <polygon points="3,2 12,7 3,12" fill={B} />
  </svg>
);

/* ── Pause ── */
export const IconPause = ({ size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <rect x="2.5" y="2" width="3" height="10" rx="1" fill={B} />
    <rect x="8.5" y="2" width="3" height="10" rx="1" fill={B} />
  </svg>
);

/* ── Device: Router ── */
type DP = P & { color?: string };

export const IconRouter = ({ size = 18, color = B }: DP) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <rect x="2" y="8" width="14" height="7" rx="1.5" stroke={color} strokeWidth="1.3" />
    <rect x="3.5" y="9.8" width="2" height="1.8" rx="0.4" fill={color} opacity=".7" />
    <rect x="6.5" y="9.8" width="2" height="1.8" rx="0.4" fill={color} opacity=".7" />
    <rect x="9.5" y="9.8" width="2" height="1.8" rx="0.4" fill={color} opacity=".7" />
    <circle cx="13.5" cy="10.7" r="0.85" fill={color} />
    <line x1="6" y1="8" x2="5" y2="3.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <line x1="12" y1="8" x2="13" y2="3.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="5" cy="3" r="1" fill={color} opacity=".6" />
    <circle cx="13" cy="3" r="1" fill={color} opacity=".6" />
  </svg>
);

/* ── Device: Switch ── */
export const IconSwitch = ({ size = 18, color = O }: DP) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <rect x="1.5" y="5.5" width="15" height="8" rx="1.5" stroke={color} strokeWidth="1.3" />
    <rect x="3"   y="7.5" width="1.5" height="2.5" rx="0.35" fill={color} opacity=".85" />
    <rect x="5.5" y="7.5" width="1.5" height="2.5" rx="0.35" fill={color} opacity=".85" />
    <rect x="8"   y="7.5" width="1.5" height="2.5" rx="0.35" fill={color} opacity=".85" />
    <rect x="10.5" y="7.5" width="1.5" height="2.5" rx="0.35" fill={color} opacity=".85" />
    <rect x="3"   y="11" width="1.5" height="1.2" rx="0.3" fill={color} opacity=".35" />
    <rect x="5.5" y="11" width="1.5" height="1.2" rx="0.3" fill={color} opacity=".35" />
    <circle cx="14.5" cy="8.3"  r="0.75" fill={color} />
    <circle cx="14.5" cy="10.5" r="0.75" fill={color} opacity=".45" />
    <line x1="5" y1="5.5" x2="3.5" y2="3" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    <line x1="13" y1="5.5" x2="14.5" y2="3" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

/* ── Device: Laptop / PC ── */
const G = '#34d399';
export const IconLaptop = ({ size = 18, color = G }: DP) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <rect x="3" y="2.5" width="12" height="9" rx="1.2" stroke={color} strokeWidth="1.3" />
    <rect x="4.5" y="4" width="9" height="6" rx="0.5" fill={color} opacity=".12" />
    <line x1="6.5" y1="6"   x2="11.5" y2="6"   stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity=".5" />
    <line x1="6.5" y1="7.5" x2="11.5" y2="7.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity=".5" />
    <line x1="6.5" y1="9"   x2="9.5"  y2="9"   stroke={color} strokeWidth="0.9" strokeLinecap="round" opacity=".5" />
    <path d="M1.5 15 L3 11.5 H15 L16.5 15 Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    <line x1="5.5" y1="13.2" x2="12.5" y2="13.2" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity=".5" />
  </svg>
);

/* ── Device: Server ── */
export const IconServer = ({ size = 18, color = O }: DP) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <rect x="2" y="2.5" width="14" height="4" rx="0.9" stroke={color} strokeWidth="1.2" />
    <rect x="2" y="7.5" width="14" height="4" rx="0.9" stroke={color} strokeWidth="1.2" />
    <rect x="2" y="12.5" width="14" height="3" rx="0.9" stroke={color} strokeWidth="1.2" />
    <rect x="3.5" y="3.6" width="5.5" height="1.8" rx="0.3" fill={color} opacity=".15" />
    <rect x="3.5" y="8.6" width="5.5" height="1.8" rx="0.3" fill={color} opacity=".15" />
    <circle cx="13.8" cy="4.5"  r="0.75" fill={color} />
    <circle cx="12"   cy="4.5"  r="0.75" fill={color} opacity=".45" />
    <circle cx="13.8" cy="9.5"  r="0.75" fill={color} />
    <circle cx="12"   cy="9.5"  r="0.75" fill={color} opacity=".45" />
    <circle cx="13.8" cy="14"   r="0.75" fill={color} opacity=".45" />
  </svg>
);

/* ── Device: Wireless AP ── */
export const IconWifi = ({ size = 18, color = B }: DP) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M3.5 9.5 A7.5 7.5 0 0 1 14.5 9.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    <path d="M5.8 11.5 A4.5 4.5 0 0 1 12.2 11.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    <path d="M8 13.5 A2 2 0 0 1 10 13.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    <circle cx="9" cy="15.5" r="1.1" fill={color} />
    <line x1="7" y1="4" x2="6" y2="1.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity=".7" />
    <line x1="11" y1="4" x2="12" y2="1.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity=".7" />
  </svg>
);

/* ── Device: VoIP Phone ── */
export const IconPhone = ({ size = 18, color = O }: DP) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <rect x="3" y="3" width="12" height="9" rx="1.2" stroke={color} strokeWidth="1.3" />
    <rect x="4.5" y="4.5" width="9" height="5" rx="0.6" fill={color} opacity=".12" />
    <rect x="3" y="13" width="12" height="2.5" rx="0.8" stroke={color} strokeWidth="1.1" />
    <circle cx="6"  cy="9.8" r="0.7" fill={color} opacity=".6" />
    <circle cx="9"  cy="9.8" r="0.7" fill={color} opacity=".6" />
    <circle cx="12" cy="9.8" r="0.7" fill={O} opacity=".6" />
  </svg>
);

/* ── Clock / History ── */
export const IconClock = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="6.5" stroke={B} strokeWidth="1.3" />
    <line x1="9" y1="5" x2="9" y2="9" stroke={B} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="9" x2="12" y2="11" stroke={B} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="9" cy="9" r="1" fill={B} />
  </svg>
);

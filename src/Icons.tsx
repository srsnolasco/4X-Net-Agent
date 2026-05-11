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

/* ── Clock / History ── */
export const IconClock = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="6.5" stroke={B} strokeWidth="1.3" />
    <line x1="9" y1="5" x2="9" y2="9" stroke={B} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="9" x2="12" y2="11" stroke={B} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="9" cy="9" r="1" fill={B} />
  </svg>
);

// 매장 시안(캔버스)과 같은 선 아이콘. stroke는 currentColor라 부모 color를 따른다
const Icon = ({ size = 22, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const BackIcon = ({ size }) => <Icon size={size}><path d="M15 5l-7 7 7 7" /></Icon>;

export const ShareIcon = ({ size = 20 }) => <Icon size={size}><path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5" /></Icon>;

export const QrIcon = ({ size = 18 }) => <Icon size={size}><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /><path d="M9 9h6v6H9z" /></Icon>;

export const BadQrIcon = ({ size = 32 }) => <Icon size={size}><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /><path d="M8 8l8 8M16 8l-8 8" /></Icon>;

export const CameraIcon = ({ size = 22 }) => <Icon size={size}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Icon>;

export const ShopIcon = ({ size = 22 }) => <Icon size={size}><path d="M4 10l1.5-5h13L20 10M4 10v10h16V10M4 10h16M9 20v-5h6v5" /></Icon>;

export const SearchIcon = ({ size = 18 }) => <Icon size={size}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Icon>;

export const ChevronRightIcon = ({ size = 16 }) => <Icon size={size}><path d="M9 6l6 6-6 6" /></Icon>;

export const InfoIcon = ({ size = 22 }) => (
  <Icon size={size}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v6" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" /></Icon>
);

export const MonitorIcon = ({ size = 20 }) => <Icon size={size}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></Icon>;

export const NextIcon = ({ size = 18 }) => <Icon size={size}><path d="M9 5l7 7-7 7" /></Icon>;

export const ArrowUpIcon = ({ size = 18 }) => <Icon size={size}><path d="M12 19V5M6 11l6-6 6 6" /></Icon>;

export const ArrowDownIcon = ({ size = 18 }) => <Icon size={size}><path d="M12 5v14M6 13l6 6 6-6" /></Icon>;

export const CloseIcon = ({ size = 18 }) => <Icon size={size}><path d="M6 6l12 12M18 6L6 18" /></Icon>;

// 매장 기기 화면(4·4f·4j) 머리의 주사위 로고. 색은 기기 화면 팔레트
export const DiceLogo = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#818CF8" strokeWidth="1.8" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8.5" cy="8.5" r="1.2" fill="#818CF8" />
    <circle cx="15.5" cy="15.5" r="1.2" fill="#818CF8" />
    <circle cx="12" cy="12" r="1.2" fill="#818CF8" />
  </svg>
);

export const WifiOffIcon = ({ size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 8.5a15 15 0 0120 0M5 12a10 10 0 0114 0M8.5 15.5a5 5 0 017 0" />
    <circle cx="12" cy="19" r="1" fill="#94A3B8" />
    <path d="M3 3l18 18" />
  </svg>
);

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

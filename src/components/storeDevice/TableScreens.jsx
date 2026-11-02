import { D } from './deviceTheme';
import { DiceLogo, WifiOffIcon } from '../store/StoreIcons';
import { fmt } from '../store/fmt';
import { storeTitle } from '../../constants/store';
import CheckinQrPanel from './CheckinQrPanel';

export const TABLE_W = 1180;
export const TABLE_H = 820;

const frame = {
  width: TABLE_W, height: TABLE_H, boxSizing: 'border-box', padding: '48px 56px 32px',
  display: 'flex', flexDirection: 'column', gap: '28px',
};

const Header = ({ store, deviceName }) => (
  <header style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <DiceLogo size={40} />
    <span style={{ fontSize: '30px', fontWeight: 700 }}>{storeTitle(store)}</span>
    <span style={{ marginLeft: 'auto', fontSize: '20px', color: D.sub }}>{deviceName}</span>
  </header>
);

/** 4f 테이블 기기: 매장 이름 + 1시간마다 바뀌는 체크인 QR. 기기에서 나가는 버튼 없음 */
export const TableQr = ({ store, deviceName, url, remainingMs, t }) => (
  <div style={frame}>
    <Header store={store} deviceName={deviceName} />
    <CheckinQrPanel url={url} remainingMs={remainingMs} t={t} />
    <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '15px', color: D.foot }}>
      <span>{t('store', 'tableFootLeft')}</span>
      <span>{t('store', 'tableFootRight')}</span>
    </footer>
  </div>
);

const retryButton = (big) => ({
  marginTop: big ? 12 : 8, height: big ? 88 : 80, padding: big ? '0 64px' : '0 56px', borderRadius: '24px', border: 'none',
  backgroundColor: D.button, color: '#FFFFFF', fontSize: big ? '32px' : '28px', fontWeight: 700, cursor: 'pointer',
});

/** 4c 매장 TV 연결 끊김 (1920×1080) */
export const TvOffline = ({ lastText, onRetry, t }) => (
  <div style={{ width: 1920, height: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px' }}>
    <WifiOffIcon size={96} />
    <h1 style={{ margin: 0, fontSize: '56px', fontWeight: 700 }}>{t('store', 'offlineTitle')}</h1>
    {lastText && <span style={{ fontSize: '26px', color: D.sub }}>{fmt(t('store', 'offlineLast'), { time: lastText })}</span>}
    <button onClick={onRetry} style={retryButton(true)}>{t('store', 'offlineRetry')}</button>
  </div>
);

/** 4c2 테이블 기기 연결 끊김 (1180×820) */
export const TableOffline = ({ store, deviceName, lastText, onRetry, t }) => (
  <div style={frame}>
    <Header store={store} deviceName={deviceName} />
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
      <WifiOffIcon size={88} />
      <h1 style={{ margin: 0, fontSize: '48px', fontWeight: 700 }}>{t('store', 'offlineTitle')}</h1>
      <span style={{ fontSize: '24px', lineHeight: 1.5, color: D.soft, textAlign: 'center', whiteSpace: 'pre-line' }}>{t('store', 'offlineTableDesc')}</span>
      {lastText && <span style={{ fontSize: '20px', color: D.sub }}>{fmt(t('store', 'offlineLast'), { time: lastText })}</span>}
      <button onClick={onRetry} style={retryButton(false)}>{t('store', 'offlineRetry')}</button>
    </div>
  </div>
);

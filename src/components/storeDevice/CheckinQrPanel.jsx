import { QRCodeSVG } from 'qrcode.react';
import { D, hourMin } from './deviceTheme';
import { fmt } from '../store/fmt';
import { CHECKIN_QR_SLOT_MS } from '../../constants/store';

const Step = ({ n, big, children }) => (
  <li style={{ display: 'flex', gap: big ? '24px' : '16px', alignItems: 'center' }}>
    <span style={{
      width: big ? 60 : 40, height: big ? 60 : 40, flexShrink: 0, borderRadius: 999,
      backgroundColor: D.stepBg, color: D.stepText, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: big ? '28px' : '18px', fontWeight: 700,
    }}>{n}</span>
    <span style={{ fontSize: big ? '38px' : '24px' }}>{children}</span>
  </li>
);

/**
 * 체크인 QR 본문 — TV 4h(big)와 테이블 기기 4f가 같은 구성에 크기만 다르다.
 * 왼쪽 "QR 찍고 이 매장에서 게임해요" + 3단계, 오른쪽 QR + 남은 시간 바.
 */
const CheckinQrPanel = ({ big, url, remainingMs, t }) => {
  const qrSize = big ? 600 : 400;
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', gap: big ? '120px' : '64px' }}>
      <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: big ? '44px' : '28px' }}>
        <h1 style={{
          margin: 0, fontSize: big ? '88px' : '48px', fontWeight: 700, lineHeight: big ? 1.2 : 1.25,
          letterSpacing: big ? '-0.02em' : '-0.01em', whiteSpace: 'pre-line',
        }}>
          {t('store', 'deviceQrTitle')}
        </h1>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: big ? '28px' : '18px' }}>
          <Step n={1} big={big}>{t('store', 'deviceQrStep1')}</Step>
          <Step n={2} big={big}>
            {t('store', 'deviceQrStep2')}{' '}
            <span style={{ color: D.sub }}>{t('store', big ? 'deviceQrStep2SubTv' : 'deviceQrStep2SubTable')}</span>
          </Step>
          <Step n={3} big={big}>{t('store', 'deviceQrStep3')}</Step>
        </ol>
      </section>
      <section style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: big ? '24px' : '18px' }}>
        <div style={{ padding: big ? 32 : 24, borderRadius: big ? '36px' : '28px', backgroundColor: '#FFFFFF', display: 'flex' }}>
          <QRCodeSVG value={url} size={qrSize} bgColor="#FFFFFF" fgColor="#111827" role="img" aria-label={t('store', 'deviceQrAria')} />
        </div>
        <div style={{ width: qrSize + (big ? 64 : 48), display: 'flex', flexDirection: 'column', gap: big ? '10px' : '8px' }}>
          <div style={{ height: big ? 10 : 8, borderRadius: 999, backgroundColor: D.border, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, (remainingMs / CHECKIN_QR_SLOT_MS) * 100)}%`, height: '100%',
              backgroundColor: D.accent, transition: 'width 1s linear',
            }} />
          </div>
          <span style={{ textAlign: 'center', fontSize: big ? '26px' : '18px', color: D.sub }}>
            {fmt(t('store', 'deviceQrLeft'), { t: hourMin(remainingMs, t) })}
          </span>
        </div>
      </section>
    </div>
  );
};

export default CheckinQrPanel;

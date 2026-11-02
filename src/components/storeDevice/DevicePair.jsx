import { D, MONO } from './deviceTheme';
import { DiceLogo } from '../store/StoreIcons';
import { fmt } from '../store/fmt';

const PAIR_TTL_MS = 10 * 60 * 1000;

const Step = ({ n, children }) => (
  <li style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
    <span style={{
      width: 40, height: 40, flexShrink: 0, borderRadius: 999, backgroundColor: D.pairStepBg, color: D.accentText,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
    }}>{n}</span>
    {children}
  </li>
);

/**
 * 4j 매장 기기로 쓰기 (1180×820). 로그인 없이 6자리 + 남은 시간. 숫자는 10분마다 새로 받는다 (부모가).
 * code가 없으면(받는 중·실패) 숫자 자리에 — 를 둔다.
 */
const DevicePair = ({ code, leftMs, leftText, onLogin, t }) => (
  <div style={{
    width: 1180, height: 820, boxSizing: 'border-box', padding: '48px 56px 32px',
    display: 'flex', flexDirection: 'column', gap: '28px',
  }}>
    <header style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <DiceLogo size={40} />
      <span style={{ fontSize: '30px', fontWeight: 700 }}>{t('store', 'devicePairHeader')}</span>
    </header>

    <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', gap: '64px' }}>
      <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '44px', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em', whiteSpace: 'pre-line' }}>
          {t('store', 'devicePairTitle')}
        </h1>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '22px', color: D.soft }}>
          <Step n={1}>{t('store', 'devicePairStep1')}</Step>
          <Step n={2}>{t('store', 'devicePairStep2')}</Step>
          <Step n={3}>{t('store', 'devicePairStep3')}</Step>
        </ol>
      </section>

      <section style={{ width: 420, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{
          width: '100%', boxSizing: 'border-box', padding: '40px 24px', borderRadius: '28px',
          backgroundColor: D.cardAlt, border: `1px solid ${D.border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '18px', color: D.sub }}>{t('store', 'devicePairCodeLabel')}</span>
          <span style={{ fontFamily: MONO, fontSize: '80px', fontWeight: 700, letterSpacing: '0.06em', color: '#FFFFFF', whiteSpace: 'nowrap' }}>
            {code ? `${code.slice(0, 3)} ${code.slice(3)}` : '— — —'}
          </span>
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ height: 8, borderRadius: 999, backgroundColor: D.pairStepBg, overflow: 'hidden' }}>
            <div style={{
              width: `${code ? Math.min(100, (leftMs / PAIR_TTL_MS) * 100) : 0}%`, height: '100%',
              backgroundColor: D.accent, transition: 'width 1s linear',
            }} />
          </div>
          <span style={{ fontSize: '17px', color: D.sub, textAlign: 'center', minHeight: 24 }}>
            {code ? fmt(t('store', 'devicePairLeft'), { t: leftText }) : ''}
          </span>
        </div>
      </section>
    </div>

    <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '15px', color: D.sub }}>
      <span>{t('store', 'devicePairFoot')}</span>
      <button onClick={onLogin} style={{ border: 'none', background: 'none', padding: '12px 0', cursor: 'pointer', fontSize: '15px', color: D.sub }}>
        {t('store', 'devicePairToLogin')}
      </button>
    </footer>
  </div>
);

export default DevicePair;

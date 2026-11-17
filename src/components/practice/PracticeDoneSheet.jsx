import { PartyPopper } from 'lucide-react';
import { V } from '../../utils/cssUtils';
import BottomSheet from './BottomSheet';

const secondary = (extra) => ({
  padding: '13px', borderRadius: '12px', cursor: 'pointer',
  border: `1px solid var(--th-border)`, backgroundColor: V('--th-bg'),
  color: V('--th-text'), fontSize: '14px', fontWeight: 700, ...extra,
});

/** 연습 13 · 끝. 바깥을 눌러도 닫히지 않는다 — 셋 중 하나를 골라야 연습이 끝난다. */
const PracticeDoneSheet = ({ onCreate, onHome, onAgain, t }) => (
  <BottomSheet label={t('practice', 'doneTitle')} align="center">
    <div style={{
      width: 60, height: 60, borderRadius: '20px',
      background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <PartyPopper size={28} color="#fff" />
    </div>
    <p style={{ fontSize: '22px', fontWeight: 800, margin: 0, textAlign: 'center' }}>{t('practice', 'doneTitle')}</p>
    <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: 0, textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
      {t('practice', 'doneDesc')}
    </p>
    <p style={{ fontSize: '15px', fontWeight: 800, margin: '6px 0 0' }}>{t('practice', 'doneQuestion')}</p>
    <button
      onClick={onCreate}
      style={{
        width: '100%', padding: '15px', borderRadius: '14px', border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
        color: '#fff', fontSize: '16px', fontWeight: 700,
      }}
    >
      {t('practice', 'doneCreate')}
    </button>
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <button onClick={onHome} style={secondary()}>{t('practice', 'doneHome')}</button>
      <button onClick={onAgain} style={secondary()}>{t('practice', 'doneAgain')}</button>
    </div>
  </BottomSheet>
);

export default PracticeDoneSheet;

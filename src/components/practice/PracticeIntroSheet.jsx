import { V } from '../../utils/cssUtils';
import BottomSheet from './BottomSheet';

const ITEMS = ['intro1', 'intro2', 'intro3', 'intro4', 'intro5'];

/** 연습 1 · 시작 안내. 「연습 시작하기」를 눌러야 연습이 켜진다. */
const PracticeIntroSheet = ({ onStart, onClose, t }) => (
  <BottomSheet label={t('practice', 'introTitle')} onClose={onClose}>
    <span style={{
      alignSelf: 'flex-start', fontSize: '11px', fontWeight: 800,
      color: V('--th-practice-text'), backgroundColor: V('--th-practice-bg'),
      borderRadius: '20px', padding: '3px 9px',
    }}>
      {t('practice', 'badge')}
    </span>
    <p style={{ fontSize: '21px', fontWeight: 800, margin: 0 }}>{t('practice', 'introTitle')}</p>
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ITEMS.map((key, i) => (
        <li key={key} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '14px' }}>
          <span style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            backgroundColor: V('--th-primary'), color: '#fff', fontSize: '12px', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {i + 1}
          </span>
          {t('practice', key)}
        </li>
      ))}
    </ol>
    <p style={{
      fontSize: '13px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.5,
      padding: '12px 14px', borderRadius: '12px', backgroundColor: V('--th-bg'),
    }}>
      {t('practice', 'introNote')}
    </p>
    <button
      onClick={onStart}
      style={{
        width: '100%', padding: '15px', borderRadius: '14px', border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
        color: '#fff', fontSize: '16px', fontWeight: 700,
      }}
    >
      {t('practice', 'introStart')}
    </button>
    <button
      onClick={onClose}
      style={{ width: '100%', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', color: V('--th-text-sub'), fontSize: '14px', fontWeight: 600 }}
    >
      {t('practice', 'introLater')}
    </button>
  </BottomSheet>
);

export default PracticeIntroSheet;

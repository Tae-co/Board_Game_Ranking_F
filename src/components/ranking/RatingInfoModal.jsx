import { X } from 'lucide-react';
import { V } from '../../utils/cssUtils';

// 방 랭킹의 ⓘ 버튼 팝업. 점수 계산·decay 규칙 요약 (Elo / 칩 게임 내용이 다르다)
const Section = ({ title, items }) => (
  <div style={{ marginBottom: 16 }}>
    <p style={{ fontSize: 13, fontWeight: 700, color: V('--th-text'), marginBottom: 6 }}>{title}</p>
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      {items.map(item => (
        <li key={item} style={{ fontSize: 12, lineHeight: 1.6, color: V('--th-text-sub') }}>{item}</li>
      ))}
    </ul>
  </div>
);

const RatingInfoModal = ({ chip, onClose, t }) => (
  <div
    onClick={onClose}
    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{ borderRadius: 16, padding: 24, paddingBottom: 8, margin: '0 16px', width: '100%', maxWidth: 340, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: V('--th-text'), margin: 0 }}>{t('ranking', 'infoTitle')}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <X size={18} color="var(--th-text-sub)" />
        </button>
      </div>
      <Section title={t('ranking', 'infoCalcTitle')} items={t('ranking', chip ? 'infoChip' : 'infoCalc')} />
      <Section title={t('ranking', 'infoDecayTitle')} items={t('ranking', chip ? 'infoChipDecay' : 'infoDecay')} />
    </div>
  </div>
);

export default RatingInfoModal;

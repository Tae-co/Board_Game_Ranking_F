import { Star, ChevronRight } from 'lucide-react';
import { V } from '../../utils/cssUtils';

/**
 * 모임 현황(/season) 들어가는 카드 — 커뮤니티 모드에서만. 방마다 시즌이 달라서 커뮤니티는 전체 기간으로 본다 (plan-season-reset §22).
 * 공유자가 많을수록 카드가 많이 나가므로 어드민만이 아니라 멤버 전원에게 보인다.
 */
const SeasonEntryCard = ({ onClick, t }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', marginBottom: '24px', padding: '16px 18px',
      borderRadius: '16px', cursor: 'pointer', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: '14px',
      backgroundColor: V('--th-card'),
      border: `1px solid var(--th-border)`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
      background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Star size={19} color="#fff" />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '3px', color: V('--th-text') }}>
        {t('season', 'entryTitle')}
      </div>
      <div style={{ fontSize: '11px', color: V('--th-text-sub') }}>
        {t('season', 'entryDesc')}
      </div>
    </div>
    <ChevronRight size={18} color="var(--th-text-sub)" />
  </button>
);

export default SeasonEntryCard;

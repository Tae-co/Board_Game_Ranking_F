import { V } from '../../utils/cssUtils';
import DiceAvatar from '../shared/DiceAvatar';
import { fmt } from './fmt';

const avatarColors = [`rgba(var(--th-primary-rgb), 0.3)`, 'var(--th-bg-deep)', 'var(--th-border)'];

/**
 * 매장 홈 오늘의 그룹 (시안 2 · 2j). 그룹이 있으면 "오늘의 그룹 N명 · 이름들 · 그룹 관리" 줄(→ 2i),
 * 없으면 "같이 온 사람이 있나요?" + 그룹 만들기(→ 3b) / 코드로 합류(→ 3c)
 */
const StorePartyCard = ({ party, onManage, onCreate, onJoin, creating, t }) => {
  if (party) {
    return (
      <button onClick={onManage} style={{
        textAlign: 'left', cursor: 'pointer', backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
        borderRadius: '20px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', color: V('--th-text'),
      }}>
        <span style={{ display: 'flex', flexShrink: 0 }}>
          {avatarColors.slice(0, Math.min(3, party.size)).map((c, i) => (
            <span key={i} style={{
              width: 32, height: 32, borderRadius: 999, backgroundColor: c, border: `2px solid ${V('--th-card')}`,
              marginLeft: i ? -10 : 0, position: 'relative', zIndex: 3 - i, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <DiceAvatar size={28} color={i ? V('--th-text-sub') : V('--th-primary')} />
            </span>
          ))}
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700 }}>{fmt(t('store', 'partyRowTitle'), { n: party.size })}</span>
          <span style={{ fontSize: '13px', color: V('--th-text-sub'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {party.nicknames.join(' · ')}
          </span>
        </span>
        <span style={{
          flexShrink: 0, height: 36, padding: '0 14px', borderRadius: 999, display: 'flex', alignItems: 'center',
          backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.1)`, color: V('--th-primary'), fontSize: '13px', fontWeight: 700,
        }}>{t('store', 'partyManage')}</span>
      </button>
    );
  }
  return (
    <section style={{
      backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.1)`, border: `1px solid rgba(${V('--th-primary-rgb')}, 0.3)`,
      borderRadius: '20px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'partyNoneTitle')}</span>
        <span style={{ fontSize: '14px', lineHeight: 1.5, color: V('--th-text-sub') }}>{t('store', 'partyNoneDesc')}</span>
      </span>
      <button onClick={onCreate} disabled={creating} style={{
        height: 52, border: 'none', borderRadius: '14px', cursor: 'pointer', backgroundColor: V('--th-primary'), color: '#fff',
        fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        opacity: creating ? 0.6 : 1,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        {t('store', 'partyCreate')}
      </button>
      <button onClick={onJoin} style={{
        height: 48, borderRadius: '14px', cursor: 'pointer', border: `1px solid rgba(${V('--th-primary-rgb')}, 0.3)`,
        backgroundColor: V('--th-card'), color: V('--th-primary'), fontSize: '15px', fontWeight: 700,
      }}>{t('store', 'partyJoinByCode')}</button>
    </section>
  );
};

export default StorePartyCard;

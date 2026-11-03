import { V } from '../../utils/cssUtils';
import { fmt } from '../store/fmt';
import { card, meBadge } from '../store/storeStyles';

/**
 * 판별 순위 점수표 (시안 5b·5d): 순위 · 이름 · 판별 점수 · 합계(게임 점수 합).
 * 대회 중 나간 사람(left)은 순위 없이 맨 아래 회색
 */
const ContestStandings = ({ standings, rounds, myId, t }) => {
  const cols = `20px minmax(0, 1fr) repeat(${rounds}, 36px) 52px`;
  return (
    <div style={{ ...card, padding: '4px 16px', overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: '4px', height: 36, fontSize: '12px', color: V('--th-text-sub') }}>
        <span /><span />
        {Array.from({ length: rounds }, (_, i) => (
          <span key={i} style={{ textAlign: 'center' }}>{fmt(t('contest', 'roundN'), { n: i + 1 })}</span>
        ))}
        <span style={{ textAlign: 'right' }}>{t('contest', 'total')}</span>
      </div>
      {standings.map((s, i) => (
        <div key={s.memberId ?? `left-${i}`} style={{
          display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: '4px', height: 52,
          borderTop: i ? `1px solid ${V('--th-border')}` : 0, opacity: s.left ? 0.55 : 1,
        }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: s.rank === 1 ? V('--th-primary') : V('--th-text-sub') }}>
            {s.rank ?? '–'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 500, minWidth: 0, color: V('--th-text') }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nickname ?? t('contest', 'leftMember')}</span>
            {s.memberId != null && s.memberId === myId && <span style={meBadge}>{t('contest', 'meBadge')}</span>}
            {s.left && <span style={{ fontSize: '11px', color: V('--th-text-sub') }}>{t('contest', 'leftTag')}</span>}
          </span>
          {s.points.map((p, r) => (
            <span key={r} style={{ textAlign: 'center', fontSize: '14px', color: p == null ? '#9CA3AF' : V('--th-text') }}>{p ?? '–'}</span>
          ))}
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: V('--th-primary') }}>{s.total}</span>
            <span style={{ fontSize: '11px', color: V('--th-text-sub'), whiteSpace: 'nowrap' }}>{fmt(t('contest', 'gameScoreN'), { n: Math.round(s.gameScore) })}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default ContestStandings;

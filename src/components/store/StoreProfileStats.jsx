import { V } from '../../utils/cssUtils';
import { ChevronRightIcon } from './StoreIcons';
import { fmt, num } from './fmt';

const rowStyle = { display: 'flex', alignItems: 'center', padding: '16px 18px', borderBottom: `1px solid ${V('--th-border')}` };
const labelStyle = { flex: 1, fontSize: 14, fontWeight: 600, color: V('--th-text') };
const valueStyle = { fontSize: 13, color: V('--th-text-sub') };

/** 10/30 */
const md = (iso) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

/**
 * 프로필 매장 탭 아래쪽 (시안 7): 승·패·승률·점수 네 칸 + 이번 시즌 순위 · 가장 많이 한 게임 ·
 * 신고 초기화 줄 · 방문 · 매장 홈 바로가기
 */
const StoreProfileStats = ({ sp, navigate, t }) => {
  const games = sp.wins + sp.losses;
  const tiles = [
    ['WINS', sp.wins, V('--th-text')],
    ['LOSSES', sp.losses, V('--th-text')],
    ['WIN RATE', games ? `${Math.round((sp.wins / games) * 100)}%` : '—', V('--th-text')],
    ['SCORE', num(sp.bestScore), V('--th-primary')],
  ];
  const name = [sp.name, sp.branch].filter(Boolean).join(' ');
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
        {tiles.map(([label, value, color]) => (
          <div key={label} style={{
            borderRadius: 16, padding: '16px 4px', backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 18, backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={rowStyle}>
          <span style={labelStyle}>{t('profile', 'storeSeasonRank')}</span>
          <span style={valueStyle}>{sp.rank ? fmt(t('profile', 'storeRankValue'), { rank: sp.rank, n: sp.rankTotal }) : '—'}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>{t('profile', 'storeTopGame')}</span>
          <span style={valueStyle}>{sp.topGameName ? fmt(t('profile', 'storeTopGameValue'), { game: sp.topGameName, n: sp.topGameCount }) : '—'}</span>
        </div>
        {sp.resets.map(r => (
          <div key={r.id} style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: 2, padding: '14px 18px', backgroundColor: '#FFF7ED' }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#9A3412' }}>{fmt(t('profile', 'storeResetRow'), { game: r.gameName })}</span>
              <span style={{ fontSize: 13, color: '#9A3412' }}>{md(r.resetAt)}</span>
            </span>
            {r.matchEndedAt && (
              <span style={{ fontSize: 12, lineHeight: 1.5, color: '#7C2D12' }}>
                {fmt(t('profile', 'storeResetDesc'), { when: md(r.matchEndedAt) })}
              </span>
            )}
          </div>
        ))}
        <div style={rowStyle}>
          <span style={labelStyle}>{t('store', 'visitsLabel')}</span>
          <span style={valueStyle}>{fmt(t('store', 'daysCount'), { n: sp.visits })}</span>
        </div>
        <button onClick={() => navigate(`/store/${sp.storeId}`)} style={{
          width: '100%', display: 'flex', alignItems: 'center', padding: '16px 18px', border: 'none', background: 'none',
          cursor: 'pointer', textAlign: 'left', color: V('--th-text-sub'),
        }}>
          <span style={labelStyle}>{fmt(t('profile', 'storeHomeLink'), { name })}</span>
          <ChevronRightIcon />
        </button>
      </div>
    </>
  );
};

export default StoreProfileStats;

import { V } from '../../utils/cssUtils';

const StatsCard = ({ myRank, myWinRate, myStreak, streakLoading, myRankPosition, rankLoading, t }) => {
  if (!myRank) return null;
  const total = myRank.winCount + myRank.loseCount;
  if (total === 0) return null;
  const streakColor = myStreak?.isWin ? '#22c55e' : '#ef4444';
  const streakLabel = myStreak ? `${myStreak.count}${myStreak.isWin ? '연승' : '연패'}` : null;
  const labelStyle = { fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: 0, whiteSpace: 'nowrap' };
  const valueStyle = { fontSize: 15, fontWeight: 900 };
  const itemStyle = { flex: 1, minWidth: 0 };
  return (
    <div style={{ display: 'flex', gap: 10, padding: '9px 10px', borderRadius: 12, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
      <div style={{ flexShrink: 0, paddingRight: 10, borderRight: `1px solid var(--th-border)` }}>
        <div style={labelStyle}>STREAK</div>
        <div style={{ ...valueStyle, color: streakLoading ? V('--th-text-sub') : streakColor }}>
          {streakLoading ? '—' : (streakLabel ?? '—')}
        </div>
      </div>
      <div style={itemStyle}>
        <div style={labelStyle}>{t('ranking', 'statsMatches')}</div>
        <div style={{ ...valueStyle, color: V('--th-text') }}>{total}</div>
      </div>
      <div style={itemStyle}>
        <div style={labelStyle}>{t('ranking', 'statsWins')}</div>
        <div style={{ ...valueStyle, color: '#22c55e' }}>{myRank.winCount}</div>
      </div>
      <div style={itemStyle}>
        <div style={labelStyle}>{t('ranking', 'statsLosses')}</div>
        <div style={{ ...valueStyle, color: '#ef4444' }}>{myRank.loseCount}</div>
      </div>
      <div style={{ ...itemStyle, paddingRight: 6 }}>
        <div style={labelStyle}>{t('ranking', 'statsWinRate')}</div>
        <div style={{ ...valueStyle, color: V('--th-text') }}>{myWinRate}%</div>
      </div>
      <div style={{ flexShrink: 0, paddingLeft: 14, borderLeft: `1px solid var(--th-border)`, textAlign: 'left' }}>
        <div style={labelStyle}>RANK</div>
        <div style={{ ...valueStyle, color: rankLoading ? V('--th-text-sub') : 'var(--th-primary)' }}>
          {rankLoading ? '—' : (myRankPosition ? `#${myRankPosition}` : '—')}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

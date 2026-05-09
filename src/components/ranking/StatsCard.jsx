import { V } from '../../utils/cssUtils';

const StatsCard = ({ myRank, myWinRate, myStreak, streakLoading, myRankPosition, rankLoading, t }) => {
  if (!myRank) return null;
  const total = myRank.winCount + myRank.loseCount;
  if (total === 0) return null;
  const streakColor = myStreak?.isWin ? '#22c55e' : '#ef4444';
  const streakLabel = myStreak ? `${myStreak.count}${myStreak.isWin ? '연승' : '연패'}` : null;
  return (
    <div style={{ display: 'flex', gap: 16, padding: '10px 14px', borderRadius: 12, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
      <div style={{ paddingRight: 16, borderRight: `1px solid var(--th-border)` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>STREAK</div>
        <div style={{ fontSize: 15, fontWeight: 900, color: streakLoading ? V('--th-text-sub') : streakColor }}>
          {streakLoading ? '—' : (streakLabel ?? '—')}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking', 'statsMatches')}</div>
        <div style={{ fontSize: 15, fontWeight: 900, color: V('--th-text') }}>{total}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking', 'statsWins')}</div>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#22c55e' }}>{myRank.winCount}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking', 'statsLosses')}</div>
        <div style={{ fontSize: 15, fontWeight: 900, color: '#ef4444' }}>{myRank.loseCount}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking', 'statsWinRate')}</div>
        <div style={{ fontSize: 15, fontWeight: 900, color: V('--th-text') }}>{myWinRate}%</div>
      </div>
      <div style={{ marginLeft: 'auto', paddingLeft: 16, borderLeft: `1px solid var(--th-border)`, textAlign: 'right' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>RANK</div>
        <div style={{ fontSize: 15, fontWeight: 900, color: rankLoading ? V('--th-text-sub') : 'var(--th-primary)' }}>
          {rankLoading ? '—' : (myRankPosition ? `${myRankPosition}위` : '—')}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

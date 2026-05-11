import { cl } from './scoreUtils';

const WinnerBanner = ({ schema, duelWinnerId, duelFellowshipId, duelWinCondition, players, totals, winnerId, winnerNickname, t, lang }) => {
  if (schema?.type === 'duel') {
    if (!duelWinnerId) return null;
    const fellowshipPlayer = players.find(p => p.memberId === duelFellowshipId) || players[0];
    const winnerIsFellowship = duelWinnerId === fellowshipPlayer.memberId;
    const teamColor = winnerIsFellowship ? '#16a34a' : '#b91c1c';
    const teamEmoji = winnerIsFellowship ? '🌿' : '👁️';
    const teamName = winnerIsFellowship ? t('scoreSheet', 'fellowshipTeam') : t('scoreSheet', 'sauronTeam');
    const winnerNick = players.find(p => p.memberId === duelWinnerId)?.nickname;
    return (
      <div style={{ margin: '16px 16px 0', background: teamColor, borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <span style={{ fontSize: 28 }}>{teamEmoji}</span>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>{`${teamName} ${t('scoreSheet', 'duelWins')}`}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{winnerNick}</div>
          {duelWinCondition && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{cl(schema.winConditions.find(w => w.key === duelWinCondition), lang)}</div>}
        </div>
      </div>
    );
  }

  if (schema?.type === 'splendorduel') {
    if (!duelWinnerId) return null;
    const winnerNick = players.find(p => p.memberId === duelWinnerId)?.nickname;
    const wc = schema.winConditions.find(w => w.key === duelWinCondition);
    return (
      <div style={{ margin: '16px 16px 0', background: 'var(--th-primary)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6 2L3 6l9 13 9-13-3-4H6zm1.5 2h9L18 6l-6 8.7L6 6l1.5-2z"/></svg>
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>{`${winnerNick} ${t('scoreSheet', 'duelWins')}`}</div>
          {wc && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: wc.color || 'rgba(255,255,255,0.6)' }} />
            {cl(wc, lang)}
          </div>}
        </div>
      </div>
    );
  }

  if (schema?.type === 'conditional') {
    if (!duelWinnerId) return null;
    const winnerNick = players.find(p => p.memberId === duelWinnerId)?.nickname;
    const wc = schema.winConditions?.find(w => w.key === duelWinCondition);
    return (
      <div style={{ margin: '16px 16px 0', background: wc?.color || 'var(--th-primary)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M2 19h20v2H2v-2zm2-2l3-8 5 4 5-4 3 8H4zm8-10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>{`${winnerNick} ${t('scoreSheet', 'victory')}`}</div>
          {wc && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.6)' }} />
            {cl(wc, lang)}
          </div>}
        </div>
      </div>
    );
  }

  if (!Object.values(totals).some(v => v > 0)) return null;
  return (
    <div style={{ margin: '16px 16px 0', background: 'var(--th-primary)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M2 19h20v2H2v-2zm2-2l3-8 5 4 5-4 3 8H4zm8-10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>
      </div>
      <div>
        <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>{`${winnerNickname} ${t('scoreSheet', 'victory')}`}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{`${totals[winnerId]}${t('scoreSheet', 'firstPlace')}`}</div>
      </div>
    </div>
  );
};

export default WinnerBanner;

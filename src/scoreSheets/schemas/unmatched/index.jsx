import { useState, useEffect } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { HP_MAX, TEAM_COLORS, getAvailableModes } from './constants';
import HpBar from './HpBar';
import TeamSetup from './TeamSetup';

export const unmatchedSchema = {
  name: 'Unmatched',
  type: 'unmatched',
  lowestWins: false,
};

export const UnmatchedTable = ({ players, handleChange, onTotalsChange, readOnly, scores }) => {
  const { t } = useLanguage();
  const _saved = (() => { try { return JSON.parse(scores?.['_data']?.['all'] || ''); } catch { return null; } })();

  const availableModes = getAvailableModes(players.length);
  const [gameMode, setGameMode] = useState(_saved?.gameMode || availableModes[0]);

  const [teamAssign, setTeamAssign] = useState(() => {
    if (_saved?.teamAssign) return _saved.teamAssign;
    const init = {};
    players.forEach((p, i) => { init[p.memberId] = (i % 2) + 1; });
    return init;
  });

  const [setupDone, setSetupDone] = useState(readOnly || !!_saved?.hpMap);
  const [setupHp, setSetupHp] = useState(() => {
    if (_saved?.hpMap) return _saved.hpMap;
    const init = {};
    players.forEach((p) => { init[p.memberId] = 16; });
    return init;
  });
  const [setupChar, setSetupChar] = useState(() => {
    if (_saved?.charMap) return _saved.charMap;
    const init = {};
    players.forEach((p) => { init[p.memberId] = ''; });
    return init;
  });

  const [hpMap, setHpMap] = useState(() => {
    if (_saved?.hpMap) return _saved.hpMap;
    const init = {};
    players.forEach((p) => { init[p.memberId] = 16; });
    return init;
  });
  const [charMap, setCharMap] = useState(() => {
    if (_saved?.charMap) return _saved.charMap;
    const init = {};
    players.forEach((p) => { init[p.memberId] = ''; });
    return init;
  });

  const [winningTeam, setWinningTeam] = useState(_saved?.winningTeam ?? null);

  const handleStartGame = () => {
    setHpMap({ ...setupHp });
    setCharMap({ ...setupChar });
    setSetupDone(true);
  };

  const adjust = (memberId, delta) => {
    if (readOnly) return;
    setHpMap((prev) => ({
      ...prev,
      [memberId]: Math.max(0, Math.min(HP_MAX, (prev[memberId] ?? 16) + delta)),
    }));
  };

  useEffect(() => {
    if (!setupDone) return;
    let totalsToEmit = {};
    if (gameMode === '2v2' && winningTeam !== null) {
      players.forEach((p) => {
        totalsToEmit[p.memberId] = teamAssign[p.memberId] === winningTeam ? 100 : 0;
      });
    } else {
      players.forEach((p) => {
        totalsToEmit[p.memberId] = hpMap[p.memberId] ?? 16;
      });
    }
    onTotalsChange?.(totalsToEmit);
    handleChange('_data', 'all', JSON.stringify({ hpMap, charMap, teamAssign, winningTeam, gameMode }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hpMap, setupDone, winningTeam]);

  const sorted = [...players].sort((a, b) => (hpMap[b.memberId] ?? 0) - (hpMap[a.memberId] ?? 0));
  const distinctTeams = gameMode === '2v2' ? [...new Set(Object.values(teamAssign))].sort() : [];

  if (!setupDone) {
    return (
      <TeamSetup
        players={players}
        availableModes={availableModes}
        gameMode={gameMode}
        setGameMode={setGameMode}
        teamAssign={teamAssign}
        setTeamAssign={setTeamAssign}
        setupHp={setupHp}
        setSetupHp={setSetupHp}
        setupChar={setupChar}
        setSetupChar={setSetupChar}
        onStart={handleStartGame}
        t={t}
      />
    );
  }

  return (
    <div>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--th-border)', backgroundColor: 'var(--th-bg)' }}>
        <span style={{ fontSize: 12, color: 'var(--th-text-sub)' }}>
          {gameMode === '2v2' ? t('scoreSheet', 'unmatchedHintTeam') : t('scoreSheet', 'unmatchedHint')}
        </span>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {players.map((p) => {
          const hp = hpMap[p.memberId] ?? 16;
          const maxHp = setupHp[p.memberId] ?? 16;
          const isEliminated = hp <= 0;
          const isLow = hp > 0 && hp <= 3;
          const hpColor = isEliminated ? '#6b7280' : isLow ? '#dc2626' : 'var(--th-text)';
          const heroName = charMap[p.memberId];
          const teamNum = gameMode === '2v2' ? teamAssign[p.memberId] : null;
          const tc = teamNum ? TEAM_COLORS[teamNum] : null;
          const borderColor = isEliminated ? 'var(--th-border)' : tc ? tc.border : isLow ? '#dc2626' : 'var(--th-primary)';

          return (
            <div key={p.memberId} style={{ marginBottom: 12, padding: '14px 16px', borderRadius: 14, border: `2px solid ${borderColor}`, background: isEliminated ? 'var(--th-bg)' : 'var(--th-card)', opacity: isEliminated ? 0.6 : 1, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: tc ? tc.badge : isEliminated ? 'var(--th-border)' : 'var(--th-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
                    {p.nickname[0]}
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 15, color: isEliminated ? 'var(--th-text-sub)' : 'var(--th-text)' }}>{p.nickname}</span>
                    {(heroName || tc) && (
                      <div style={{ fontSize: 11, color: 'var(--th-text-sub)', marginTop: 1 }}>
                        {tc && <span style={{ color: tc.badge, fontWeight: 700, marginRight: heroName ? 4 : 0 }}>{t('scoreSheet', 'teamPrefix')}{tc.label}</span>}
                        {heroName}
                      </div>
                    )}
                  </div>
                  {isEliminated && <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', padding: '2px 8px', borderRadius: 10, background: 'var(--th-border)' }}>{t('scoreSheet', 'eliminated')}</span>}
                  {isLow && !isEliminated && <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>{t('scoreSheet', 'danger')}</span>}
                </div>
                <div style={{ fontWeight: 900, fontSize: 24, color: hpColor, minWidth: 44, textAlign: 'right' }}>{hp}</div>
              </div>

              <HpBar hp={hp} maxHp={maxHp} />

              {!readOnly && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
                  {[{ delta: -3, label: '−3' }, { delta: -1, label: '−1' }, { delta: +1, label: '+1' }, { delta: +3, label: '+3' }].map(({ delta, label }) => {
                    const isNeg = delta < 0;
                    return (
                      <button key={delta} onClick={() => adjust(p.memberId, delta)} disabled={isEliminated && isNeg} style={{ width: 44, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, background: isNeg ? '#fee2e2' : '#dcfce7', color: isNeg ? '#dc2626' : '#16a34a', opacity: isEliminated && isNeg ? 0.3 : 1 }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {gameMode === '2v2' && !readOnly && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--th-border)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--th-text-sub)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('scoreSheet', 'selectWinningTeam')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {distinctTeams.map((teamNum) => {
              const tc = TEAM_COLORS[teamNum];
              const isSelected = winningTeam === teamNum;
              const teamPlayers = players.filter(p => teamAssign[p.memberId] === teamNum);
              return (
                <button key={teamNum} onClick={() => setWinningTeam(isSelected ? null : teamNum)} style={{ flex: 1, padding: '10px 8px', borderRadius: 12, border: 'none', cursor: 'pointer', background: isSelected ? tc.badge : 'var(--th-card)', color: isSelected ? tc.text : 'var(--th-text-sub)', fontWeight: 800, fontSize: 13, outline: isSelected ? `2px solid ${tc.badge}` : `1px solid ${tc.badge}`, transition: 'all 0.15s' }}>
                  <div>{t('scoreSheet', 'teamPrefix')}{tc.label}</div>
                  <div style={{ fontSize: 10, marginTop: 3, opacity: 0.8 }}>{teamPlayers.map(p => p.nickname).join(', ')}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ background: 'var(--th-primary)', padding: '12px 16px' }}>
        <div style={{ fontSize: 11, color: 'var(--th-card)', marginBottom: 8, fontWeight: 700 }}>{t('scoreSheet', 'hpRanking')}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {sorted.map((p, i) => {
            const hp = hpMap[p.memberId] ?? 16;
            const isFirst = i === 0 && hp > 0;
            const teamNum = gameMode === '2v2' ? teamAssign[p.memberId] : null;
            const tc = teamNum ? TEAM_COLORS[teamNum] : null;
            return (
              <div key={p.memberId} style={{ flex: 1, minWidth: 60, padding: '8px 10px', borderRadius: 10, textAlign: 'center', background: isFirst ? 'rgba(255,255,255,0.2)' : tc ? `${tc.badge}22` : 'rgba(255,255,255,0.08)', outline: tc ? `1px solid ${tc.badge}44` : 'none' }}>
                <div style={{ fontSize: 10, color: isFirst ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{i + 1}{t('scoreSheet', 'rankSuffix')} · {p.nickname}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: isFirst ? '#FFD700' : hp > 0 ? 'var(--th-card)' : '#6b7280' }}>{hp > 0 ? hp : '✗'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

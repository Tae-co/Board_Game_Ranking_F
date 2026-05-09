import { HP_MAX, TEAM_COLORS } from './constants';

const TeamSetup = ({ players, availableModes, gameMode, setGameMode, teamAssign, setTeamAssign, setupHp, setSetupHp, setupChar, setSetupChar, onStart, t }) => (
  <div style={{ padding: '16px' }}>
    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--th-text-sub)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {t('scoreSheet', 'unmatchedSetup')}
    </div>

    {availableModes.length > 1 && (
      <div style={{ marginBottom: 16, display: 'flex', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--th-border)' }}>
        {availableModes.map((mode) => (
          <button key={mode} onClick={() => setGameMode(mode)} style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: gameMode === mode ? 'var(--th-primary)' : 'var(--th-card)', color: gameMode === mode ? '#fff' : 'var(--th-text-sub)' }}>
            {t('scoreSheet', mode === '2v2' ? 'teamMode2v2' : 'freeForAll')}
          </button>
        ))}
      </div>
    )}

    {availableModes.length === 1 && availableModes[0] === '1v1' && (
      <div style={{ marginBottom: 14, display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: 'var(--th-primary)', color: '#fff', fontSize: 12, fontWeight: 800 }}>
        {t('scoreSheet', 'mode1v1')}
      </div>
    )}

    {players.map((p) => (
      <div key={p.memberId} style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 14, border: '1px solid var(--th-border)', background: 'var(--th-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--th-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
            {p.nickname[0]}
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--th-text)' }}>{p.nickname}</span>
        </div>

        {gameMode === '2v2' && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--th-text-sub)', marginBottom: 6 }}>{t('scoreSheet', 'teamLabel')}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2].map((teamNum) => {
                const tc = TEAM_COLORS[teamNum];
                const isSelected = teamAssign[p.memberId] === teamNum;
                return (
                  <button key={teamNum} onClick={() => setTeamAssign(prev => ({ ...prev, [p.memberId]: teamNum }))} style={{ padding: '5px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, background: isSelected ? tc.badge : 'var(--th-bg)', color: isSelected ? tc.text : 'var(--th-text-sub)', outline: isSelected ? `2px solid ${tc.badge}` : '1px solid var(--th-border)' }}>
                    {t('scoreSheet', 'teamPrefix')}{tc.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--th-text-sub)', marginBottom: 4 }}>{t('scoreSheet', 'hero')}</div>
          <input type="text" value={setupChar[p.memberId] || ''} onChange={(e) => setSetupChar(prev => ({ ...prev, [p.memberId]: e.target.value }))} placeholder={t('scoreSheet', 'heroPlaceholder')} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 13, border: '1px solid var(--th-border)', background: 'var(--th-bg)', color: 'var(--th-text)', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--th-text-sub)', marginBottom: 6 }}>{t('scoreSheet', 'initialHp')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setSetupHp(prev => ({ ...prev, [p.memberId]: Math.max(1, (prev[p.memberId] ?? 16) - 1) }))} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#dc2626', fontWeight: 800, fontSize: 16 }}>−</button>
            <input type="text" inputMode="numeric" pattern="[0-9]*" value={setupHp[p.memberId] ?? 16} onChange={(e) => { const v = Math.max(1, Math.min(HP_MAX, Number(e.target.value) || 1)); setSetupHp(prev => ({ ...prev, [p.memberId]: v })); }} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 8, fontSize: 18, fontWeight: 900, border: '1px solid var(--th-border)', background: 'var(--th-bg)', color: 'var(--th-text)', outline: 'none' }} />
            <button onClick={() => setSetupHp(prev => ({ ...prev, [p.memberId]: Math.min(HP_MAX, (prev[p.memberId] ?? 16) + 1) }))} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#dcfce7', color: '#16a34a', fontWeight: 800, fontSize: 16 }}>+</button>
          </div>
        </div>
      </div>
    ))}

    <button onClick={onStart} style={{ width: '100%', padding: '12px 0', borderRadius: 50, border: 'none', background: 'var(--th-primary)', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
      {t('scoreSheet', 'startGame')}
    </button>
  </div>
);

export default TeamSetup;

/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

export const saboteurSchema = {
  name: "SABOTEUR",
  type: "saboteur",
  categories: [],
};

const createEmptyRound = (players) => ({
  roles: Object.fromEntries(players.map(p => [p.memberId, null])),
  winner: null,
  gold: Object.fromEntries(players.map(p => [p.memberId, ''])),
});

const RoundCard = ({ round, roundIdx, players, canRemove, readOnly, onRemove, onSetRole, onSetWinner, onSetGold, t }) => (
  <div style={{ border: '1px solid var(--th-border)', borderRadius: '12px', padding: '14px', marginBottom: '14px', background: 'var(--th-bg)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--th-text)' }}>{t('scoreSheet', 'sabRound').replace('{n}', roundIdx + 1)}</span>
      {canRemove && (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--th-text-sub)', padding: '2px 6px' }}>{t('scoreSheet', 'sabRemove')}</button>
      )}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '6px', marginBottom: '8px' }}>
      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--th-text-sub)' }}>{t('scoreSheet', 'sabName')}</span>
      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--th-text-sub)', width: 124, textAlign: 'center' }}>{t('scoreSheet', 'sabRole')}</span>
      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--th-text-sub)', width: 52, textAlign: 'center' }}>{t('scoreSheet', 'sabGold')}</span>
    </div>

    {players.map(p => {
      const role = round.roles[p.memberId];
      const gold = round.gold[p.memberId];
      return (
        <div key={p.memberId} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--th-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nickname}</span>
          <div style={{ display: 'flex', gap: '4px', width: 124 }}>
            <button
              onClick={readOnly ? undefined : () => onSetRole(p.memberId, 'miner')}
              disabled={readOnly}
              style={{
                flex: 1, padding: '6px 2px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                cursor: readOnly ? 'default' : 'pointer',
                border: `1.5px solid ${role === 'miner' ? '#B45309' : 'var(--th-border)'}`,
                background: role === 'miner' ? '#B4530922' : 'var(--th-bg)',
                color: role === 'miner' ? '#B45309' : 'var(--th-text-sub)',
                opacity: readOnly ? 0.7 : 1,
              }}
            >{t('scoreSheet', 'sabMiner')}</button>
            <button
              onClick={readOnly ? undefined : () => onSetRole(p.memberId, 'saboteur')}
              disabled={readOnly}
              style={{
                flex: 1, padding: '6px 2px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                cursor: readOnly ? 'default' : 'pointer',
                border: `1.5px solid ${role === 'saboteur' ? '#DC2626' : 'var(--th-border)'}`,
                background: role === 'saboteur' ? '#DC262622' : 'var(--th-bg)',
                color: role === 'saboteur' ? '#DC2626' : 'var(--th-text-sub)',
                opacity: readOnly ? 0.7 : 1,
              }}
            >{t('scoreSheet', 'sabSaboteur')}</button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={gold}
            placeholder="0"
            readOnly={readOnly}
            onChange={readOnly ? undefined : (e) => onSetGold(p.memberId, e.target.value)}
            style={{
              width: 52, height: 36, textAlign: 'center', fontSize: '15px', fontWeight: '700',
              borderRadius: '8px', outline: 'none',
              border: `1.5px solid ${gold !== '' && gold !== '0' ? '#F59E0B' : 'var(--th-border)'}`,
              background: 'var(--th-card)',
              color: gold !== '' && gold !== '0' ? '#F59E0B' : 'var(--th-text)',
            }}
          />
        </div>
      );
    })}

    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--th-border)' }}>
      <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--th-text-sub)', marginBottom: '8px' }}>{t('scoreSheet', 'sabRoundWinner')}</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={readOnly ? undefined : () => onSetWinner('miner')}
          disabled={readOnly}
          style={{
            flex: 1, padding: '9px', borderRadius: '10px', fontSize: '12px', fontWeight: '700',
            cursor: readOnly ? 'default' : 'pointer',
            border: `1.5px solid ${round.winner === 'miner' ? '#B45309' : 'var(--th-border)'}`,
            background: round.winner === 'miner' ? '#B4530922' : 'var(--th-bg)',
            color: round.winner === 'miner' ? '#B45309' : 'var(--th-text-sub)',
            opacity: readOnly ? 0.7 : 1,
          }}
        >{t('scoreSheet', 'sabMinersWin')}</button>
        <button
          onClick={readOnly ? undefined : () => onSetWinner('saboteur')}
          disabled={readOnly}
          style={{
            flex: 1, padding: '9px', borderRadius: '10px', fontSize: '12px', fontWeight: '700',
            cursor: readOnly ? 'default' : 'pointer',
            border: `1.5px solid ${round.winner === 'saboteur' ? '#DC2626' : 'var(--th-border)'}`,
            background: round.winner === 'saboteur' ? '#DC262622' : 'var(--th-bg)',
            color: round.winner === 'saboteur' ? '#DC2626' : 'var(--th-text-sub)',
            opacity: readOnly ? 0.7 : 1,
          }}
        >{t('scoreSheet', 'sabSaboteursWin')}</button>
      </div>
    </div>
  </div>
);

export const SaboteurTable = ({ players, onTotalsChange, readOnly }) => {
  const { t } = useLanguage();
  const [rounds, setRounds] = useState(() => [createEmptyRound(players)]);

  useEffect(() => {
    const totals = {};
    players.forEach(p => { totals[p.memberId] = 0; });
    rounds.forEach(r => {
      players.forEach(p => {
        totals[p.memberId] += Number(r.gold[p.memberId] || 0);
      });
    });
    onTotalsChange?.(totals);
  }, [rounds, players, onTotalsChange]);

  const addRound = () => setRounds(prev => [...prev, createEmptyRound(players)]);
  const removeRound = (idx) => setRounds(prev => prev.filter((_, i) => i !== idx));

  const setRoundRole = useCallback((roundIdx, memberId, role) =>
    setRounds(prev => prev.map((r, i) =>
      i === roundIdx ? { ...r, roles: { ...r.roles, [memberId]: role } } : r
    )), []);

  const setRoundWinner = useCallback((roundIdx, winner) =>
    setRounds(prev => prev.map((r, i) =>
      i === roundIdx ? { ...r, winner } : r
    )), []);

  const setRoundGold = useCallback((roundIdx, memberId, value) => {
    if (value === '' || /^\d+$/.test(value)) {
      setRounds(prev => prev.map((r, i) =>
        i === roundIdx ? { ...r, gold: { ...r.gold, [memberId]: value } } : r
      ));
    }
  }, []);

  const totals = {};
  players.forEach(p => { totals[p.memberId] = 0; });
  rounds.forEach(r => {
    players.forEach(p => {
      totals[p.memberId] += Number(r.gold[p.memberId] || 0);
    });
  });
  const sortedPlayers = [...players].sort((a, b) => (totals[b.memberId] || 0) - (totals[a.memberId] || 0));
  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ padding: '16px' }}>
      {rounds.map((round, ridx) => (
        <RoundCard
          key={ridx}
          round={round}
          roundIdx={ridx}
          players={players}
          canRemove={!readOnly && rounds.length > 1}
          readOnly={readOnly}
          onRemove={() => removeRound(ridx)}
          onSetRole={(memberId, role) => setRoundRole(ridx, memberId, role)}
          onSetWinner={(winner) => setRoundWinner(ridx, winner)}
          onSetGold={(memberId, value) => setRoundGold(ridx, memberId, value)}
          t={t}
        />
      ))}

      {!readOnly && (
        <button
          onClick={addRound}
          style={{
            width: '100%', padding: '12px', borderRadius: '12px', marginBottom: '16px',
            border: '1.5px dashed var(--th-border)', background: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: '700', color: 'var(--th-text-sub)',
          }}
        >
          {t('scoreSheet', 'sabAddRound')}
        </button>
      )}

      <div style={{ borderTop: '1px solid var(--th-border)', paddingTop: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--th-primary)', letterSpacing: '0.1em', marginBottom: '10px' }}>{t('scoreSheet', 'sabTotalGold')}</p>
        {sortedPlayers.map((p, idx) => {
          const total = totals[p.memberId] || 0;
          return (
            <div key={p.memberId} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px', width: 24, textAlign: 'center' }}>
                {idx < 3
                  ? rankEmojis[idx]
                  : <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--th-text-sub)' }}>{t('scoreSheet', 'sabPlace').replace('{n}', idx + 1)}</span>}
              </span>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: 'var(--th-text)' }}>{p.nickname}</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: total > 0 ? '#F59E0B' : 'var(--th-text-sub)' }}>💰 {t('scoreSheet', 'sabGoldUnit').replace('{n}', total)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

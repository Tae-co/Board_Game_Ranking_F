import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRoomMembers } from '../api/services/rooms';
import { getGames } from '../api/services/games';
import { createMatch } from '../api/services/matches';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import { getNickname } from '../auth/storage';

const SABOTEUR_GAME_ID = 17;

const createEmptyRound = (players) => ({
  roles: Object.fromEntries(players.map(p => [p.memberId, null])),
  winner: null,
  gold: Object.fromEntries(players.map(p => [p.memberId, ''])),
});

const SaboteurRoundCard = ({ round, roundIdx, players, canRemove, onRemove, onSetRole, onSetWinner, onSetGold }) => (
  <div style={{ borderRadius: '14px', padding: '16px', backgroundColor: V('--th-card'), border: '1px solid var(--th-border)', marginBottom: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
      <span style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text') }}>라운드 {roundIdx + 1}</span>
      {canRemove && (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: V('--th-text-sub'), padding: '2px 6px' }}>✕ 삭제</button>
      )}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', marginBottom: '8px', padding: '0 2px' }}>
      <span style={{ fontSize: '10px', fontWeight: '700', color: V('--th-text-sub') }}>이름</span>
      <span style={{ fontSize: '10px', fontWeight: '700', color: V('--th-text-sub'), width: 124, textAlign: 'center' }}>역할</span>
      <span style={{ fontSize: '10px', fontWeight: '700', color: V('--th-text-sub'), width: 52, textAlign: 'center' }}>받은 금</span>
    </div>

    {players.map(p => {
      const role = round.roles[p.memberId];
      const gold = round.gold[p.memberId];
      return (
        <div key={p.memberId} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nickname}</span>
          <div style={{ display: 'flex', gap: '4px', width: 124 }}>
            <button
              onClick={() => onSetRole(p.memberId, 'miner')}
              style={{
                flex: 1, padding: '6px 2px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                border: `1.5px solid ${role === 'miner' ? '#B45309' : 'var(--th-border)'}`,
                background: role === 'miner' ? '#B4530922' : 'var(--th-bg)',
                color: role === 'miner' ? '#B45309' : 'var(--th-text-sub)',
              }}
            >⛏️ 광부</button>
            <button
              onClick={() => onSetRole(p.memberId, 'saboteur')}
              style={{
                flex: 1, padding: '6px 2px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                border: `1.5px solid ${role === 'saboteur' ? '#DC2626' : 'var(--th-border)'}`,
                background: role === 'saboteur' ? '#DC262622' : 'var(--th-bg)',
                color: role === 'saboteur' ? '#DC2626' : 'var(--th-text-sub)',
              }}
            >💣 사보</button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={gold}
            placeholder="0"
            onChange={(e) => onSetGold(p.memberId, e.target.value)}
            style={{
              width: 52, height: 36, textAlign: 'center', fontSize: '15px', fontWeight: '700',
              borderRadius: '8px', outline: 'none',
              border: `1.5px solid ${gold !== '' && gold !== '0' ? '#F59E0B' : 'var(--th-border)'}`,
              background: 'var(--th-bg)',
              color: gold !== '' && gold !== '0' ? '#F59E0B' : 'var(--th-text)',
            }}
          />
        </div>
      );
    })}

    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--th-border)' }}>
      <p style={{ fontSize: '11px', fontWeight: '700', color: V('--th-text-sub'), marginBottom: '8px' }}>이 라운드 승자</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onSetWinner('miner')}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            border: `1.5px solid ${round.winner === 'miner' ? '#B45309' : 'var(--th-border)'}`,
            background: round.winner === 'miner' ? '#B4530922' : 'var(--th-bg)',
            color: round.winner === 'miner' ? '#B45309' : 'var(--th-text-sub)',
          }}
        >⛏️ 광부팀 승리</button>
        <button
          onClick={() => onSetWinner('saboteur')}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            border: `1.5px solid ${round.winner === 'saboteur' ? '#DC2626' : 'var(--th-border)'}`,
            background: round.winner === 'saboteur' ? '#DC262622' : 'var(--th-bg)',
            color: round.winner === 'saboteur' ? '#DC2626' : 'var(--th-text-sub)',
          }}
        >💣 사보타지 승리</button>
      </div>
    </div>
  </div>
);

const MatchForm = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { gameId, players } = location.state || { gameId: null, players: [] };
  const isSaboteur = gameId === SABOTEUR_GAME_ID;

  const [playerDetails, setPlayerDetails] = useState([]);
  const [scores, setScores] = useState({});
  const [rounds, setRounds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: getGames,
    staleTime: 1000 * 60 * 30,
  });
  const currentGame = games.find(g => g.id === gameId);

  useEffect(() => {
    const fetchSelectedMembers = async () => {
      try {
        const allMembers = await getRoomMembers(roomId);
        const selected = allMembers.filter(m => players.includes(m.memberId));
        setPlayerDetails(selected);
        if (isSaboteur) {
          setRounds([createEmptyRound(selected)]);
        } else {
          const init = {};
          selected.forEach(p => { init[p.memberId] = ''; });
          setScores(init);
        }
      } catch { /* ignore */ }
    };
    if (players.length > 0) fetchSelectedMembers();
  }, [roomId, players]);

  const handleScoreChange = (memberId, value) => {
    if (value === '' || /^\d+$/.test(value)) {
      setScores(prev => ({ ...prev, [memberId]: value }));
    }
  };

  const calcPlacements = () => {
    const entries = Object.entries(scores).map(([memberId, score]) => ({
      memberId: Number(memberId), score: Number(score),
    }));
    const sorted = [...entries].sort((a, b) => b.score - a.score);
    const placements = {};
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].score === sorted[i - 1].score) {
        placements[sorted[i].memberId] = placements[sorted[i - 1].memberId];
      } else {
        placements[sorted[i].memberId] = currentRank;
      }
      currentRank++;
    }
    return placements;
  };

  const addRound = () => setRounds(prev => [...prev, createEmptyRound(playerDetails)]);
  const removeRound = (idx) => setRounds(prev => prev.filter((_, i) => i !== idx));
  const setRoundRole = (roundIdx, memberId, role) =>
    setRounds(prev => prev.map((r, i) =>
      i === roundIdx ? { ...r, roles: { ...r.roles, [memberId]: role } } : r
    ));
  const setRoundWinner = (roundIdx, winner) =>
    setRounds(prev => prev.map((r, i) =>
      i === roundIdx ? { ...r, winner } : r
    ));
  const setRoundGold = (roundIdx, memberId, value) => {
    if (value === '' || /^\d+$/.test(value)) {
      setRounds(prev => prev.map((r, i) =>
        i === roundIdx ? { ...r, gold: { ...r.gold, [memberId]: value } } : r
      ));
    }
  };

  const calcSaboteurTotals = () => {
    const totals = {};
    playerDetails.forEach(p => { totals[p.memberId] = 0; });
    rounds.forEach(r => {
      playerDetails.forEach(p => {
        totals[p.memberId] += Number(r.gold[p.memberId] || 0);
      });
    });
    return totals;
  };

  const calcSaboteurPlacements = (totals) => {
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const placements = {};
    let rank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i][1] === sorted[i - 1][1]) {
        placements[Number(sorted[i][0])] = placements[Number(sorted[i - 1][0])];
      } else {
        placements[Number(sorted[i][0])] = rank;
      }
      rank++;
    }
    return placements;
  };

  const handleSubmit = async () => {
    if (isSaboteur) {
      const allRolesSet = rounds.every(r => Object.values(r.roles).every(role => role !== null));
      const allWinnersSet = rounds.every(r => r.winner !== null);
      const allGoldSet = rounds.every(r => Object.values(r.gold).every(g => g !== ''));
      if (!allRolesSet || !allWinnersSet || !allGoldSet) {
        alert('모든 라운드의 역할, 우승팀, 금 수량을 입력해주세요.');
        return;
      }
      const totals = calcSaboteurTotals();
      const placements = calcSaboteurPlacements(totals);
      setIsSubmitting(true);
      try {
        const res = await createMatch({
          boardGameId: gameId,
          roomId: Number(roomId),
          participants: playerDetails.map(p => ({ memberId: p.memberId, placement: placements[p.memberId] })),
        }, 'match_form');
        queryClient.invalidateQueries({ queryKey: ['rankings'] });
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        queryClient.invalidateQueries({ queryKey: ['communityRooms'] });
        navigate(`/invite/${roomId}`, { state: { matchResult: res }, replace: true });
      } catch {
        alert(t('matchForm', 'saveFailed'));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const hasEmpty = Object.values(scores).some(s => s === '');
    if (hasEmpty) { alert(t('matchForm', 'emptyScoreError')); return; }
    const placements = calcPlacements();
    setIsSubmitting(true);
    try {
      const res = await createMatch({
        boardGameId: gameId,
        roomId: Number(roomId),
        participants: playerDetails.map(p => ({ memberId: p.memberId, placement: placements[p.memberId] })),
      }, 'match_form');
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      navigate(`/invite/${roomId}`, { state: { matchResult: res }, replace: true });
    } catch {
      alert(t('matchForm', 'saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!gameId || players.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: V('--th-bg') }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😅</div>
        <p style={{ color: V('--th-text-sub'), marginBottom: '24px' }}>{t('matchForm', 'wrongAccess')}</p>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '12px 32px', borderRadius: '12px', backgroundColor: 'var(--th-primary)', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: '700' }}
        >
          {t('matchForm', 'goBack')}
        </button>
      </div>
    );
  }

  const previewPlacements = !isSaboteur && Object.values(scores).some(s => s !== '') ? calcPlacements() : null;
  const allFilled = isSaboteur
    ? (rounds.length > 0 && rounds.every(r =>
        r.winner !== null &&
        Object.values(r.roles).every(role => role !== null) &&
        Object.values(r.gold).every(g => g !== '')
      ))
    : (playerDetails.length > 0 && Object.values(scores).every(s => s !== ''));
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const saboteurTotals = isSaboteur ? calcSaboteurTotals() : null;
  const saboteurPlacements = isSaboteur && saboteurTotals ? calcSaboteurPlacements(saboteurTotals) : null;
  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}>

      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: '1px solid var(--th-border)' }}>
        <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--th-primary)' }}
            >
              <ArrowLeft style={{ width: 24, height: 24 }} />
            </button>
            <h1 style={{ fontSize: '17px', fontWeight: '700', color: V('--th-text') }}>
              {t('matchForm', 'submitGameResult')}
            </h1>
          </div>
          <NavAvatar />
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px' }}>

        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--th-primary)', letterSpacing: '0.1em', marginBottom: '8px' }}>
          {t('matchForm', 'matchSessionFinished')}
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: V('--th-text'), marginBottom: '6px' }}>
          {t('matchForm', 'gameOver')}
        </h2>
        <p style={{ fontSize: '13px', color: V('--th-text-sub'), marginBottom: '24px' }}>
          {t('matchForm', 'gameOverDesc')}
        </p>

        <div style={{
          borderRadius: '14px', padding: '14px 16px', marginBottom: '28px',
          backgroundColor: V('--th-card'), border: '1px solid var(--th-border)',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          {currentGame?.imageUrl ? (
            <img src={currentGame.imageUrl} alt={currentGame.name} style={{ width: 48, height: 48, borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: '10px', flexShrink: 0, backgroundColor: 'color-mix(in srgb, var(--th-primary) 14%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🎲</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '15px', fontWeight: '700', color: V('--th-text') }}>{currentGame?.name || '—'}</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>📅 {today}</span>
              <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>👥 {playerDetails.length}</span>
            </div>
          </div>
        </div>

        {isSaboteur ? (
          <>
            {rounds.map((round, ridx) => (
              <SaboteurRoundCard
                key={ridx}
                round={round}
                roundIdx={ridx}
                players={playerDetails}
                canRemove={rounds.length > 1}
                onRemove={() => removeRound(ridx)}
                onSetRole={(memberId, role) => setRoundRole(ridx, memberId, role)}
                onSetWinner={(winner) => setRoundWinner(ridx, winner)}
                onSetGold={(memberId, value) => setRoundGold(ridx, memberId, value)}
              />
            ))}

            <button
              onClick={addRound}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', marginBottom: '20px',
                border: '1.5px dashed var(--th-border)', background: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: '700', color: V('--th-text-sub'),
              }}
            >
              + 라운드 추가
            </button>

            {playerDetails.length > 0 && (
              <div style={{ borderRadius: '14px', padding: '14px 16px', backgroundColor: V('--th-card'), border: '1px solid var(--th-border)', marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--th-primary)', letterSpacing: '0.1em', marginBottom: '10px' }}>총 금 합산</p>
                {[...playerDetails]
                  .sort((a, b) => (saboteurTotals[b.memberId] || 0) - (saboteurTotals[a.memberId] || 0))
                  .map(p => {
                    const total = saboteurTotals[p.memberId] || 0;
                    const placement = saboteurPlacements?.[p.memberId];
                    return (
                      <div key={p.memberId} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '18px', width: 24, textAlign: 'center' }}>
                          {placement && placement <= 3
                            ? rankEmojis[placement - 1]
                            : <span style={{ fontSize: '12px', fontWeight: '700', color: V('--th-text-sub') }}>{placement}위</span>}
                        </span>
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: V('--th-text') }}>{p.nickname}</span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: total > 0 ? '#F59E0B' : V('--th-text-sub') }}>💰 {total}금</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
              <p style={{ flex: 1, fontSize: '11px', fontWeight: '700', color: V('--th-text-sub'), letterSpacing: '0.08em' }}>
                {t('matchForm', 'participants').toUpperCase()}
              </p>
              <p style={{ fontSize: '11px', fontWeight: '700', color: V('--th-text-sub'), letterSpacing: '0.08em', width: 96, textAlign: 'center' }}>
                {t('matchForm', 'finalScore').toUpperCase()}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {playerDetails.map((player) => {
                const placement = previewPlacements?.[player.memberId];
                const hasScore = !!scores[player.memberId];
                return (
                  <div
                    key={player.memberId}
                    style={{
                      borderRadius: '12px', padding: '12px 16px',
                      backgroundColor: V('--th-card'),
                      border: `1px solid ${hasScore ? 'var(--th-primary)' : 'var(--th-border)'}`,
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}
                  >
                    <div style={{ width: 24, textAlign: 'center', fontSize: '18px', flexShrink: 0 }}>
                      {placement && placement <= 3
                        ? rankEmojis[placement - 1]
                        : placement
                          ? <span style={{ fontSize: '12px', fontWeight: '700', color: V('--th-text-sub') }}>{placement}{t('matchForm', 'rank')}</span>
                          : <span style={{ color: 'var(--th-border)' }}>—</span>
                      }
                    </div>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: 'var(--th-primary)', color: '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: '700',
                    }}>
                      {player.nickname[0]}
                    </div>
                    <p style={{ flex: 1, fontSize: '14px', color: V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.nickname}
                    </p>
                    <input
                      type="number"
                      value={scores[player.memberId] || ''}
                      onChange={(e) => handleScoreChange(player.memberId, e.target.value)}
                      placeholder="0"
                      style={{
                        width: 80, padding: '8px', borderRadius: '8px', textAlign: 'center',
                        fontSize: '16px', fontWeight: '700', outline: 'none', flexShrink: 0,
                        backgroundColor: V('--th-bg'),
                        border: `1px solid ${hasScore ? 'var(--th-primary)' : 'var(--th-border)'}`,
                        color: V('--th-text'),
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
                      onBlur={(e) => e.target.style.borderColor = hasScore ? 'var(--th-primary)' : 'var(--th-border)'}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <div style={{ maxWidth: 390, margin: '0 auto', padding: '12px 20px calc(24px + env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !allFilled}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px',
              fontSize: '14px', fontWeight: '700', letterSpacing: '0.05em',
              backgroundColor: 'var(--th-primary)', color: '#FFFFFF', border: 'none', cursor: 'pointer',
              opacity: (isSubmitting || !allFilled) ? 0.4 : 1,
              marginBottom: '10px',
            }}
          >
            {isSubmitting ? t('matchForm', 'saving') : t('matchForm', 'submitResult').toUpperCase()}
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: V('--th-text-sub'), padding: '4px' }}
          >
            {t('matchForm', 'discardSession')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchForm;

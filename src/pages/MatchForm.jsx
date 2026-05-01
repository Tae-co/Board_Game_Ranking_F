import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const V = (v) => `var(${v})`;
const nickName = () => localStorage.getItem('nickname') || '?';

const MatchForm = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { gameId, players } = location.state || { gameId: null, players: [] };

  const [playerDetails, setPlayerDetails] = useState([]);
  const [scores, setScores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => { const res = await api.get('/games'); return res.data || []; },
    staleTime: 1000 * 60 * 30,
  });
  const currentGame = games.find(g => g.id === gameId);

  useEffect(() => {
    const fetchSelectedMembers = async () => {
      try {
        const res = await api.get(`/rooms/${roomId}/members`);
        const allMembers = res.data || [];
        const selected = allMembers.filter(m => players.includes(m.memberId));
        setPlayerDetails(selected);
        const init = {};
        selected.forEach(p => { init[p.memberId] = ''; });
        setScores(init);
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

  const handleSubmit = async () => {
    const hasEmpty = Object.values(scores).some(s => s === '');
    if (hasEmpty) { alert(t('matchForm', 'emptyScoreError')); return; }
    const placements = calcPlacements();
    setIsSubmitting(true);
    try {
      const res = await api.post('/matches', {
        boardGameId: gameId,
        roomId: Number(roomId),
        participants: playerDetails.map(p => ({ memberId: p.memberId, placement: placements[p.memberId] })),
      });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      navigate(`/ranking/${roomId}`, { state: { matchResult: res.data }, replace: true });
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

  const previewPlacements = Object.values(scores).some(s => s !== '') ? calcPlacements() : null;
  const allFilled = playerDetails.length > 0 && Object.values(scores).every(s => s !== '');
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', maxWidth: '390px', margin: '0 auto', backgroundColor: V('--th-bg'), paddingBottom: 88 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: `1px solid var(--th-border)`,
        backgroundColor: V('--th-nav-bg'), position: 'sticky', top: 0, zIndex: 10,
      }}>
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

      <div style={{ padding: '20px 20px' }}>

        {/* Label + Title */}
        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--th-primary)', letterSpacing: '0.1em', marginBottom: '8px' }}>
          {t('matchForm', 'matchSessionFinished')}
        </p>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: V('--th-text'), marginBottom: '6px' }}>
          {t('matchForm', 'gameOver')}
        </h2>
        <p style={{ fontSize: '13px', color: V('--th-text-sub'), marginBottom: '24px' }}>
          {t('matchForm', 'gameOverDesc')}
        </p>

        {/* Game Info Card */}
        <div style={{
          borderRadius: '14px', padding: '14px 16px', marginBottom: '28px',
          backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          {currentGame?.imageUrl ? (
            <img
              src={currentGame.imageUrl}
              alt={currentGame.name}
              style={{ width: 48, height: 48, borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: '10px', flexShrink: 0,
              backgroundColor: 'color-mix(in srgb, var(--th-primary) 14%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            }}>🎲</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '15px', fontWeight: '700', color: V('--th-text') }}>{currentGame?.name || '—'}</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>📅 {today}</span>
              <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>👥 {playerDetails.length}</span>
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
          <p style={{ flex: 1, fontSize: '11px', fontWeight: '700', color: V('--th-text-sub'), letterSpacing: '0.08em' }}>
            {t('matchForm', 'participants').toUpperCase()}
          </p>
          <p style={{ fontSize: '11px', fontWeight: '700', color: V('--th-text-sub'), letterSpacing: '0.08em', width: 96, textAlign: 'center' }}>
            {t('matchForm', 'finalScore').toUpperCase()}
          </p>
        </div>

        {/* Player Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {playerDetails.map((player) => {
            const placement = previewPlacements?.[player.memberId];
            const hasScore = !!scores[player.memberId];
            const rankEmojis = ['🥇', '🥈', '🥉'];

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
                      : <span style={{ color: V('--th-border') }}>—</span>
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
      </div>

      {/* Sticky Bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '390px', padding: '12px 20px 24px',
        backgroundColor: V('--th-nav-bg'), borderTop: `1px solid var(--th-border)`,
      }}>
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
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', color: V('--th-text-sub'), padding: '4px',
          }}
        >
          {t('matchForm', 'discardSession')}
        </button>
      </div>
    </div>
  );
};

export default MatchForm;

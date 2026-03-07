import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const MatchForm = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { gameId, players } = location.state || { gameId: null, players: [] };

  const [playerDetails, setPlayerDetails] = useState([]);
  const [scores, setScores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSelectedMembers = async () => {
      try {
        const res = await api.get(`/rooms/${roomId}/members`);
        const allMembers = res.data || [];
        const selected = allMembers.filter(m => players.includes(m.memberId));
        setPlayerDetails(selected);
        const initialScores = {};
        selected.forEach(p => { initialScores[p.memberId] = ''; });
        setScores(initialScores);
      } catch (err) {
        console.error('참가자 정보를 불러오는데 실패했습니다.', err);
      }
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
      memberId: Number(memberId),
      score: Number(score),
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
    try {
      setIsSubmitting(true);
      const res = await api.post('/matches', {
        boardGameId: gameId,
        roomId: Number(roomId),
        participants: playerDetails.map(p => ({ memberId: p.memberId, placement: placements[p.memberId] })),
      });
      navigate(`/ranking/${roomId}`, { state: { matchResult: res.data } });
    } catch (err) {
      alert(t('matchForm', 'saveFailed'));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!gameId || players.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#FFF8F0' }}>
        <div className="text-5xl mb-4">😅</div>
        <p className="mb-6" style={{ color: '#8B7355' }}>{t('matchForm', 'wrongAccess')}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-8 py-3 rounded-full"
          style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
        >
          {t('matchForm', 'goBack')}
        </button>
      </div>
    );
  }

  const previewPlacements = Object.values(scores).some(s => s !== '') ? calcPlacements() : null;
  const allFilled = Object.values(scores).every(s => s !== '');
  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen pb-24" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: '#FFF8F0' }}>

      {/* Header */}
      <div className="px-6 py-6 flex items-center sticky top-0 z-10" style={{ backgroundColor: '#FFF8F0' }}>
        <button
          onClick={() => navigate(-1)}
          className="mr-3 p-2 rounded-lg transition-colors"
          style={{ color: '#D4853A' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl" style={{ color: '#2C1F0E' }}>{t('matchForm', 'title')}</h1>
      </div>

      {/* Info Banner */}
      <div className="px-6 mb-6">
        <div className="rounded-xl p-4 border flex gap-3" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#D4853A' }} />
          <div>
            <p className="text-sm mb-1" style={{ color: '#2C1F0E' }}>{t('matchForm', 'infoTitle')}</p>
            <p className="text-xs" style={{ color: '#8B7355' }}>{t('matchForm', 'infoDesc')}</p>
          </div>
        </div>
      </div>

      {/* Player Score Input */}
      <div className="px-6">
        <div className="space-y-3">
          {playerDetails.map((player) => {
            const placement = previewPlacements?.[player.memberId];
            const hasScore = !!scores[player.memberId];

            return (
              <div
                key={player.memberId}
                className="rounded-xl p-4 border flex items-center gap-3"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: hasScore ? '#D4853A' : '#E5D5C0',
                }}
              >
                <div className="text-2xl w-8 text-center flex-shrink-0">
                  {placement && placement <= 3
                    ? rankEmojis[placement - 1]
                    : placement
                      ? <span className="text-sm font-bold" style={{ color: '#8B7355' }}>{placement}{t('matchForm', 'rank')}</span>
                      : <span style={{ color: '#E5D5C0' }}>—</span>
                  }
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
                >
                  {player.nickname[0]}
                </div>
                <div className="flex-1">
                  <p style={{ color: '#2C1F0E' }}>{player.nickname}</p>
                </div>
                <input
                  type="number"
                  value={scores[player.memberId] || ''}
                  onChange={(e) => handleScoreChange(player.memberId, e.target.value)}
                  placeholder={t('matchForm', 'scorePlaceholder')}
                  className="w-24 px-3 py-2 rounded-lg border text-center focus:outline-none"
                  style={{
                    backgroundColor: '#FFF8F0',
                    borderColor: hasScore ? '#D4853A' : '#E5D5C0',
                    color: '#2C1F0E',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#D4853A'}
                  onBlur={(e) => e.target.style.borderColor = hasScore ? '#D4853A' : '#E5D5C0'}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Fixed Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6" style={{ backgroundColor: '#FFF8F0', maxWidth: '375px', margin: '0 auto' }}>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !allFilled}
          className="w-full py-4 rounded-full transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {isSubmitting ? t('matchForm', 'saving') : t('matchForm', 'saveResult')}
        </button>
      </div>
    </div>
  );
};

export default MatchForm;

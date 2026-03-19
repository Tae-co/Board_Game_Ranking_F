import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';
import { SCORE_SCHEMAS } from '../scoreSheets/schemas/index';

const GameSelect = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [selectedPlayers, setSelectedPlayers] = useState(new Set());

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await api.get('/games');
      return res.data || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/members`);
      return res.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const currentGame = games.find(g => g.id === room?.boardGameId);

  const togglePlayer = (memberId) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedPlayers(newSelected);
  };

  const SCORE_SHEET_GAME_IDS = new Set([1, 2, 3, 4, 6]);

  const handleStartGame = () => {
    if (selectedPlayers.size < 2) { alert(t('gameSelect', 'minPlayersError')); return; }
    if (currentGame && selectedPlayers.size > currentGame.maxPlayers) { alert(`최대 ${currentGame.maxPlayers}명까지 참여 가능합니다.`); return; }
    const gameId = room?.boardGameId;
    const gameName = currentGame?.name || '';
    const hasScoreSheet = Object.values(SCORE_SCHEMAS).some(s =>
      gameName && (gameName.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(gameName.toLowerCase()))
    ) || SCORE_SHEET_GAME_IDS.has(gameId);

    if (hasScoreSheet) {
      navigate(`/score-sheet/${gameId}`, {
        state: { roomId, gameName, players: members.filter(m => selectedPlayers.has(m.memberId)) },
      });
    } else {
      navigate(`/match-form/${roomId}`, { state: { gameId, players: [...selectedPlayers] } });
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: 'var(--th-bg)' }}>

      {/* Header */}
      <div className="px-6 py-6 flex items-center sticky top-0 z-10" style={{ backgroundColor: 'var(--th-bg)' }}>
        <button
          onClick={() => navigate(`/invite/${roomId}`)}
          className="mr-3 p-2 rounded-lg transition-colors"
          style={{ color: 'var(--th-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-card)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl" style={{ color: 'var(--th-text)' }}>{t('gameSelect', 'title')}</h1>
      </div>

      {/* Current Game Info */}
      <div className="px-6 mb-6">
        <p className="text-sm mb-3" style={{ color: 'var(--th-text-sub)' }}>{t('gameSelect', 'currentGame')}</p>
        <div className="rounded-xl border flex items-center gap-4 p-4" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-primary)' }}>
          {currentGame?.imageUrl ? (
            <img src={currentGame.imageUrl} alt={currentGame.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl flex-shrink-0" style={{ backgroundColor: 'var(--th-bg)' }}>🎲</div>
          )}
          <div>
            <p className="font-semibold" style={{ color: 'var(--th-text)' }}>{currentGame?.name ?? '...'}</p>
            {currentGame && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--th-text-sub)' }}>{currentGame.minPlayers}~{currentGame.maxPlayers}{t('gameSelect', 'persons')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Player Selection */}
      <div className="px-6">
        <h2 className="text-sm mb-3" style={{ color: 'var(--th-text-sub)' }}>{t('gameSelect', 'selectPlayers')}</h2>
        <div className="space-y-2">
          {members.map((member) => (
            <button
              key={member.memberId}
              onClick={() => togglePlayer(member.memberId)}
              className="w-full rounded-xl p-4 border flex items-center gap-3 transition-all"
              style={{
                backgroundColor: 'var(--th-card)',
                borderColor: selectedPlayers.has(member.memberId) ? 'var(--th-primary)' : 'var(--th-border)',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
              >
                {member.nickname[0]}
              </div>
              <p className="flex-1 text-left" style={{ color: 'var(--th-text)' }}>{member.nickname}</p>
              {selectedPlayers.has(member.memberId) && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--th-primary)' }}>
                  <Check className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6" style={{ backgroundColor: 'var(--th-bg)', maxWidth: '375px', margin: '0 auto' }}>
        {currentGame && selectedPlayers.size > currentGame.maxPlayers && (
          <p className="text-center text-xs mb-2" style={{ color: '#dc2626' }}>
            최대 {currentGame.maxPlayers}명까지 참여 가능합니다.
          </p>
        )}
        <button
          onClick={handleStartGame}
          disabled={selectedPlayers.size < 2 || (currentGame && selectedPlayers.size > currentGame.maxPlayers)}
          className="w-full py-2 rounded-full text-sm font-bold transition-opacity disabled:opacity-50"
          style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
        >
          {selectedPlayers.size > 0
            ? `${selectedPlayers.size}${t('gameSelect', 'startButton')}`
            : t('gameSelect', 'startPlaceholder')}
        </button>
      </div>
    </div>
  );
};

export default GameSelect;

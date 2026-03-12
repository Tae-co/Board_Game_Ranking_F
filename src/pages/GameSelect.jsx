import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const GameSelect = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const { data: gamesRaw = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await api.get('/games');
      return (res.data || []).map(game => ({
        ...game,
        minPlayer: game.minPlayers,
        maxPlayer: game.maxPlayers,
      }));
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/members`);
      return res.data || [];
    },
  });

  const filteredGames = gamesRaw.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePlayer = (memberId) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleStartGame = () => {
    if (!selectedGame) { alert(t('gameSelect', 'noGameError')); return; }
    if (selectedPlayers.size < 2) { alert(t('gameSelect', 'minPlayersError')); return; }
    navigate(`/match-form/${roomId}`, { state: { gameId: selectedGame.id, players: [...selectedPlayers] } });
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

      {/* Search Bar */}
      <div className="px-6 mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--th-text-sub)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('gameSelect', 'searchPlaceholder')}
            className="w-full pl-12 pr-4 py-3 rounded-lg border focus:outline-none transition-all"
            style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)', color: 'var(--th-text)' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
          />
        </div>
      </div>

      {/* Game Cards */}
      <div className="mb-6">
        <h2 className="px-6 text-sm mb-3" style={{ color: 'var(--th-text-sub)' }}>{t('gameSelect', 'selectGame')}</h2>
        {filteredGames.length === 0 ? (
          <p className="px-6 py-4 text-sm" style={{ color: 'var(--th-text-sub)' }}>"{searchQuery}" {t('gameSelect', 'noResults')}</p>
        ) : (
          <div className="flex gap-4 px-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {filteredGames.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className="flex-shrink-0 w-32 rounded-xl overflow-hidden border-2 transition-all"
                style={{
                  borderColor: selectedGame?.id === game.id ? 'var(--th-primary)' : 'var(--th-border)',
                  backgroundColor: 'var(--th-card)',
                }}
              >
                <div className="h-32 flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--th-bg)' }}>
                  {game.imageUrl ? (
                    <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-4xl">🎲</div>
                  )}
                </div>
                <div className="p-2 text-left">
                  <p className="text-sm truncate" style={{ color: 'var(--th-text)' }}>{game.name}</p>
                  <p className="text-xs" style={{ color: 'var(--th-text-sub)' }}>{game.minPlayer}~{game.maxPlayer}{t('gameSelect', 'persons')}</p>
                </div>
                {selectedGame?.id === game.id && (
                  <div className="py-1 text-center" style={{ backgroundColor: 'var(--th-primary)' }}>
                    <span className="text-xs font-bold" style={{ color: '#FFFFFF' }}>{t('gameSelect', 'selected')}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Game Banner */}
      {selectedGame && (
        <div className="px-6 mb-6">
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-primary)' }}>
            <div className="flex items-center gap-3">
              {selectedGame.imageUrl ? (
                <img src={selectedGame.imageUrl} alt={selectedGame.name} className="w-9 h-9 rounded-lg object-cover" />
              ) : (
                <div className="text-3xl">🎲</div>
              )}
              <div>
                <p style={{ color: 'var(--th-text)' }}>{selectedGame.name}</p>
                <p className="text-sm" style={{ color: 'var(--th-text-sub)' }}>{selectedGame.minPlayer}~{selectedGame.maxPlayer}{t('gameSelect', 'persons')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <button
          onClick={handleStartGame}
          disabled={!selectedGame || selectedPlayers.size < 2}
          className="w-full py-4 rounded-full transition-opacity disabled:opacity-50"
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

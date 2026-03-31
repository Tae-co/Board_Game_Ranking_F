import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Search, SlidersHorizontal, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const V = (v) => `var(${v})`;

const GameSelect = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [playerSearch, setPlayerSearch] = useState('');

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

  const handleStartGame = () => {
    if (selectedPlayers.size < 2) { alert(t('gameSelect', 'minPlayersError')); return; }
    if (currentGame && selectedPlayers.size > currentGame.maxPlayers) {
      alert(t('gameSelect', 'maxPlayersError').replace('{n}', currentGame.maxPlayers));
      return;
    }
    const gameId = room?.boardGameId;
    const gameName = currentGame?.name || '';
    navigate(`/score-sheet/${gameId}`, {
      state: { roomId, gameName, players: members.filter(m => selectedPlayers.has(m.memberId)) },
    });
  };

  return (
    <div className="min-h-screen pb-24" style={{ maxWidth: '430px', margin: '0 auto', backgroundColor: V('--th-bg') }}>
      {/* Dot pattern */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'radial-gradient(circle, var(--th-dot) 1px, transparent 1px)',
        backgroundSize: '24px 24px', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '24px 16px 16px', position: 'sticky', top: 0, zIndex: 10,
          backgroundColor: V('--th-bg'),
        }}>
          <button
            onClick={() => navigate(`/invite/${roomId}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '4px', padding: '6px' }}
          >
            <ArrowLeft style={{ color: V('--th-primary'), width: '24px', height: '24px' }} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: V('--th-text') }}>{t('gameSelect', 'title')}</h1>
        </div>

        <div style={{ padding: '0 16px' }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: V('--th-text-sub') }} />
            <input
              type="text"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              placeholder={t('gameSelect', 'playerSearchPlaceholder')}
              style={{
                width: '100%', padding: '12px 16px 12px 40px', borderRadius: '12px',
                backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                color: V('--th-text'), fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
            />
          </div>

          {/* Filters hint */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '20px',
              border: `1px solid var(--th-border)`, backgroundColor: V('--th-card'),
            }}>
              <SlidersHorizontal style={{ color: V('--th-text-sub'), width: '13px', height: '13px' }} />
              <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>Filters</span>
            </div>
          </div>

          {/* Current game card + player selection */}
          {currentGame && (
            <>
              <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', border: `1px solid var(--th-primary)`, backgroundColor: V('--th-card') }}>
                {currentGame.imageUrl ? (
                  <div style={{ position: 'relative', height: '160px' }}>
                    <img src={currentGame.imageUrl} alt={currentGame.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                    <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: '22px', fontWeight: '700', color: '#FFFFFF' }}>{currentGame.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <Users style={{ color: 'rgba(255,255,255,0.7)', width: '12px', height: '12px' }} />
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                              {currentGame.minPlayers}-{currentGame.maxPlayers} Players
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', padding: '4px 10px', borderRadius: '20px', backgroundColor: V('--th-primary'), color: '#FFFFFF' }}>
                          STRATEGY
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: V('--th-bg') }}>
                    <span style={{ fontSize: '48px' }}>🎲</span>
                  </div>
                )}
              </div>

              <p style={{ fontSize: '12px', color: V('--th-text-sub'), letterSpacing: '0.1em', marginBottom: '10px' }}>
                {t('gameSelect', 'selectPlayers').toUpperCase()}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members
                  .filter(m => m.nickname.toLowerCase().includes(playerSearch.toLowerCase()))
                  .map((member) => {
                    const isSelected = selectedPlayers.has(member.memberId);
                    return (
                      <button
                        key={member.memberId}
                        onClick={() => togglePlayer(member.memberId)}
                        style={{
                          width: '100%', borderRadius: '14px', padding: '14px 16px',
                          backgroundColor: V('--th-card'),
                          border: `1px solid ${isSelected ? 'var(--th-primary)' : 'var(--th-border)'}`,
                          display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                          backgroundColor: isSelected ? V('--th-primary') : V('--th-bg'),
                          border: `1px solid var(--th-border)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', fontWeight: '700',
                          color: isSelected ? '#FFFFFF' : V('--th-text'),
                        }}>
                          {member.nickname[0]}
                        </div>
                        <p style={{ flex: 1, textAlign: 'left', color: V('--th-text'), fontSize: '15px', fontWeight: isSelected ? '600' : '400' }}>
                          {member.nickname}
                        </p>
                        {isSelected && (
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                            backgroundColor: V('--th-primary'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Check style={{ color: '#FFFFFF', width: '14px', height: '14px' }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Button */}
      <div style={{
        position: 'fixed', bottom: '0', left: 0, right: 0, padding: '12px 16px',
        backgroundColor: V('--th-bg'), borderTop: `1px solid var(--th-border)`,
        maxWidth: '430px', margin: '0 auto', boxSizing: 'border-box',
      }}>
        {currentGame && selectedPlayers.size > currentGame.maxPlayers && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#dc2626', marginBottom: '8px' }}>
            {t('gameSelect', 'maxPlayersError').replace('{n}', currentGame.maxPlayers)}
          </p>
        )}
        <button
          onClick={handleStartGame}
          disabled={selectedPlayers.size < 2 || (currentGame && selectedPlayers.size > currentGame.maxPlayers)}
          style={{
            width: '100%', padding: '14px', borderRadius: '14px', fontSize: '15px', fontWeight: '700',
            backgroundColor: V('--th-primary'), color: '#FFFFFF', border: 'none', cursor: 'pointer',
            opacity: (selectedPlayers.size < 2 || (currentGame && selectedPlayers.size > currentGame.maxPlayers)) ? 0.5 : 1,
          }}
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

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Search, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';
import { usePresence } from '../hooks/usePresence';

const V = (v) => `var(${v})`;
const nickName = () => localStorage.getItem('nickname') || '?';

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

  const myId = Number(localStorage.getItem('userId'));
  const onlineIds = usePresence(myId, roomId);

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

  const isDisabled = selectedPlayers.size < 2 || (currentGame && selectedPlayers.size > currentGame.maxPlayers);

  return (
    <div style={{ minHeight: '100vh', maxWidth: '390px', margin: '0 auto', backgroundColor: V('--th-bg'), paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: `1px solid var(--th-border)`,
        backgroundColor: V('--th-nav-bg'), position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <button
            onClick={() => navigate(`/invite/${roomId}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--th-primary)' }}
          >
            <ArrowLeft style={{ width: 24, height: 24 }} />
          </button>
          <h1 style={{ fontSize: '17px', fontWeight: '700', color: V('--th-text') }}>
            {t('gameSelect', 'title')}
          </h1>
        </div>
        <div
          onClick={() => navigate('/profile')}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: 'var(--th-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0,
          }}
        >
          {nickName()[0].toUpperCase()}
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Current Game Card */}
        {currentGame && (
          <div style={{
            borderRadius: '14px', padding: '14px 16px', marginBottom: '24px',
            backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            {currentGame.imageUrl ? (
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
            <div>
              <p style={{ fontSize: '16px', fontWeight: '700', color: V('--th-text'), marginBottom: '2px' }}>
                {currentGame.name}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users style={{ color: V('--th-text-sub'), width: 12, height: 12 }} />
                <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
                  {currentGame.minPlayers}-{currentGame.maxPlayers} PLAYERS
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Select Players Label */}
        <p style={{ fontSize: '11px', fontWeight: '700', color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: '12px' }}>
          {t('gameSelect', 'selectPlayers').toUpperCase()}
        </p>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            width: 14, height: 14, color: V('--th-text-sub'),
          }} />
          <input
            type="text"
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
            placeholder={t('gameSelect', 'playerSearchPlaceholder')}
            style={{
              width: '100%', padding: '10px 12px 10px 34px', borderRadius: '10px',
              backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
              color: V('--th-text'), fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
          />
        </div>

        {/* Player List */}
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
                    width: '100%', borderRadius: '12px', padding: '12px 16px',
                    backgroundColor: V('--th-card'),
                    border: `${isSelected ? '2' : '1'}px solid ${isSelected ? 'var(--th-primary)' : 'var(--th-border)'}`,
                    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      backgroundColor: isSelected ? 'var(--th-primary)' : V('--th-bg'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', fontWeight: '700',
                      color: isSelected ? '#FFFFFF' : V('--th-text'),
                    }}>
                      {member.nickname[0]}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 11, height: 11, borderRadius: '50%',
                      backgroundColor: onlineIds.has(member.memberId) ? '#22c55e' : '#9ca3af',
                      border: '2px solid var(--th-card)',
                    }} />
                  </div>
                  <p style={{ flex: 1, textAlign: 'left', color: V('--th-text'), fontSize: '15px', fontWeight: isSelected ? '600' : '400' }}>
                    {member.nickname}
                  </p>
                  {isSelected && (
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: 'var(--th-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check style={{ color: '#FFFFFF', width: 14, height: 14 }} />
                    </div>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* Sticky Bottom Button */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '390px', padding: '12px 20px 24px',
        backgroundColor: V('--th-nav-bg'), borderTop: `1px solid var(--th-border)`,
      }}>
        {currentGame && selectedPlayers.size > currentGame.maxPlayers && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#dc2626', marginBottom: '8px' }}>
            {t('gameSelect', 'maxPlayersError').replace('{n}', currentGame.maxPlayers)}
          </p>
        )}
        <button
          onClick={handleStartGame}
          disabled={isDisabled}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: '700',
            backgroundColor: 'var(--th-primary)', color: '#FFFFFF', border: 'none', cursor: 'pointer',
            opacity: isDisabled ? 0.4 : 1,
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

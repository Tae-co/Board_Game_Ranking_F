import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Search, ChevronRight, User } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const ROOM_COLORS = ['#C0392B', '#8E44AD', '#2980B9', '#16A085', '#D35400', '#27AE60'];

const Lobby = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gamePage, setGamePage] = useState(0);
  const [gameSearch, setGameSearch] = useState('');
  const GAMES_PER_PAGE = 6;
  const nickname = localStorage.getItem('nickname') || '플레이어';
  const userId = localStorage.getItem('userId');
  const isAdmin = localStorage.getItem('role') === 'ADMIN';

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', userId],
    queryFn: async () => {
      if (!userId || userId === 'null') return [];
      const res = await api.get(`/rooms/my/${userId}`);
      return res.data || [];
    },
    enabled: !!userId && userId !== 'null',
    staleTime: 1000 * 60 * 2,
  });

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await api.get('/games');
      return res.data || [];
    },
    enabled: mode === 'create',
    staleTime: 1000 * 60 * 30,
  });

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) { alert(t('lobby', 'roomNameRequired')); return; }
    if (!selectedGameId) { alert(t('lobby', 'gameRequired')); return; }
    setIsSubmitting(true);
    try {
      const res = await api.post('/rooms', {
        roomName: newRoomName,
        memberId: Number(userId),
        boardGameId: selectedGameId,
      });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setMode(null);
      setNewRoomName('');
      setSelectedGameId(null);
      navigate(`/invite/${res.data.roomId}`);
    } catch {
      alert(t('lobby', 'createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) { alert(t('lobby', 'codeRequired')); return; }
    setIsSubmitting(true);
    try {
      await api.post('/rooms/join', { inviteCode: joinCode.trim(), memberId: Number(userId) });
      setJoinCode('');
      setMode(null);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    } catch {
      alert(t('lobby', 'joinFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm(t('lobby', 'logoutConfirm'))) {
      localStorage.removeItem('userId');
      localStorage.removeItem('nickname');
      localStorage.removeItem('role');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  };

  const V = (v) => `var(${v})`;

  return (
    <div className="min-h-screen pb-8" style={{ maxWidth: '430px', margin: '0 auto', backgroundColor: V('--th-bg') }}>
      {/* Dot pattern */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `radial-gradient(circle, var(--th-dot) 1px, transparent 1px)`,
        backgroundSize: '24px 24px', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '24px 20px' }}>
        {/* Profile Card */}
        <div style={{ borderRadius: '16px', padding: '20px', marginBottom: '20px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '12px', color: V('--th-text-sub'), marginBottom: '4px' }}>{t('lobby', 'greeting')}</p>
              <p style={{ fontSize: '20px', fontWeight: '600', color: V('--th-text') }}>{nickname}{t('lobby', 'greetingSuffix')}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: V('--th-primary'), color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
                >
                  {t('lobby', 'manageGames')}
                </button>
              )}
              <button
                onClick={() => navigate('/profile')}
                style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', backgroundColor: V('--th-bg'), color: V('--th-primary'), border: `1px solid var(--th-border)`, cursor: 'pointer' }}
              >
                {t('lobby', 'profile')}
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <LogOut style={{ color: V('--th-text-sub'), width: '14px', height: '14px' }} />
            <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('common', 'logout')}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => { setMode(mode === 'create' ? null : 'create'); setSelectedGameId(null); setNewRoomName(''); }}
            style={{
              padding: '18px 12px', borderRadius: '16px',
              backgroundColor: mode === 'create' ? V('--th-primary') : V('--th-card'),
              border: `1px solid ${mode === 'create' ? 'var(--th-primary)' : 'var(--th-border)'}`,
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
            }}
          >
            <Plus style={{ color: mode === 'create' ? '#FFFFFF' : V('--th-primary'), width: '20px', height: '20px' }} />
            <span style={{ fontWeight: '700', fontSize: '14px', color: mode === 'create' ? '#FFFFFF' : V('--th-text') }}>
              {t('lobby', 'createGroup')}
            </span>
          </button>
          <button
            onClick={() => { setMode(mode === 'join' ? null : 'join'); setJoinCode(''); }}
            style={{
              padding: '18px 12px', borderRadius: '16px',
              backgroundColor: mode === 'join' ? V('--th-primary') : V('--th-card'),
              border: `1px solid ${mode === 'join' ? 'var(--th-primary)' : 'var(--th-border)'}`,
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <User style={{ color: mode === 'join' ? '#FFFFFF' : V('--th-text-sub'), width: '20px', height: '20px' }} />
              <User style={{ color: mode === 'join' ? '#FFFFFF' : V('--th-text-sub'), width: '20px', height: '20px', marginLeft: '-8px' }} />
            </div>
            <span style={{ fontWeight: '700', fontSize: '14px', color: mode === 'join' ? '#FFFFFF' : V('--th-text') }}>
              {t('lobby', 'joinWithCode')}
            </span>
          </button>
        </div>

        {/* Create Room Panel */}
        {mode === 'create' && (
          <div style={{ borderRadius: '16px', padding: '20px', marginBottom: '20px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text'), marginBottom: '16px' }}>
              {t('lobby', 'createGroup')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder={t('lobby', 'groupNamePlaceholder')}
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`,
                  color: V('--th-text'), fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
              />
              <div>
                <p style={{ fontSize: '12px', color: V('--th-text-sub'), marginBottom: '8px' }}>{t('lobby', 'selectGame')}</p>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: V('--th-text-sub') }} />
                  <input
                    type="text"
                    value={gameSearch}
                    onChange={(e) => { setGameSearch(e.target.value); setGamePage(0); }}
                    placeholder={t('lobby', 'gameSearchPlaceholder')}
                    style={{
                      width: '100%', padding: '8px 12px 8px 34px', borderRadius: '10px',
                      backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`,
                      color: V('--th-text'), fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {(gameSearch
                    ? games.filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()))
                    : games.slice(gamePage * GAMES_PER_PAGE, (gamePage + 1) * GAMES_PER_PAGE)
                  ).map((game) => (
                    <button
                      key={game.id}
                      onClick={() => setSelectedGameId(game.id)}
                      style={{
                        borderRadius: '10px', overflow: 'hidden',
                        border: `2px solid ${selectedGameId === game.id ? 'var(--th-primary)' : 'var(--th-border)'}`,
                        backgroundColor: V('--th-bg'), cursor: 'pointer',
                      }}
                    >
                      {game.imageUrl ? (
                        <img src={game.imageUrl} alt={game.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎲</div>
                      )}
                      <p style={{
                        fontSize: '11px', padding: '4px', textAlign: 'center',
                        color: selectedGameId === game.id ? V('--th-primary') : V('--th-text'),
                        fontWeight: selectedGameId === game.id ? '700' : '400',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {game.name}
                      </p>
                    </button>
                  ))}
                </div>
                {!gameSearch && games.length > GAMES_PER_PAGE && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                    {Array.from({ length: Math.ceil(games.length / GAMES_PER_PAGE) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setGamePage(i)}
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%', fontSize: '12px', fontWeight: '700',
                          backgroundColor: gamePage === i ? V('--th-primary') : V('--th-bg'),
                          color: gamePage === i ? '#FFFFFF' : V('--th-text-sub'),
                          border: `1px solid var(--th-border)`, cursor: 'pointer',
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleCreateRoom}
                disabled={isSubmitting || !newRoomName.trim() || !selectedGameId}
                style={{
                  width: '100%', padding: '12px', borderRadius: '24px', fontSize: '14px', fontWeight: '700',
                  backgroundColor: V('--th-primary'), color: '#FFFFFF', border: 'none', cursor: 'pointer',
                  opacity: (isSubmitting || !newRoomName.trim() || !selectedGameId) ? 0.5 : 1,
                }}
              >
                {isSubmitting ? t('lobby', 'creating') : t('lobby', 'createRoom')}
              </button>
            </div>
          </div>
        )}

        {/* Join Room Panel */}
        {mode === 'join' && (
          <div style={{ borderRadius: '16px', padding: '20px', marginBottom: '20px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text'), marginBottom: '16px' }}>
              {t('lobby', 'joinWithCode')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                placeholder={t('lobby', 'inviteCodePlaceholder')}
                autoFocus
                maxLength={8}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px', textAlign: 'center',
                  backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`,
                  color: V('--th-primary'), fontSize: '18px', fontFamily: 'monospace',
                  letterSpacing: '0.3em', fontWeight: '700', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
              />
              <button
                onClick={handleJoinRoom}
                disabled={isSubmitting || !joinCode.trim()}
                style={{
                  width: '100%', padding: '12px', borderRadius: '24px', fontSize: '14px', fontWeight: '700',
                  backgroundColor: V('--th-primary'), color: '#FFFFFF', border: 'none', cursor: 'pointer',
                  opacity: (isSubmitting || !joinCode.trim()) ? 0.5 : 1,
                }}
              >
                {isSubmitting ? '...' : t('lobby', 'join')}
              </button>
            </div>
          </div>
        )}

        {/* Room List */}
        <div>
          {rooms.length === 0 ? (
            <div style={{ borderRadius: '16px', padding: '32px', border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
              <p style={{ color: V('--th-text-sub') }}>{t('lobby', 'noGroups')}</p>
              <p style={{ fontSize: '13px', marginTop: '8px', color: V('--th-text-sub') }}>{t('lobby', 'noGroupsDesc')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rooms.map((room, idx) => {
                const color = ROOM_COLORS[idx % ROOM_COLORS.length];
                return (
                  <button
                    key={room.roomId}
                    onClick={() => navigate(`/invite/${room.roomId}`)}
                    style={{
                      width: '100%', borderRadius: '16px', padding: '16px',
                      backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                      display: 'flex', alignItems: 'center', gap: '14px',
                      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--th-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--th-border)'}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                      backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px',
                    }}>
                      🎲
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '600', color: V('--th-text'), fontSize: '15px', marginBottom: '2px' }}>
                        {room.roomName || room.name}
                      </p>
                    </div>
                    <ChevronRight style={{ color: V('--th-primary'), width: '18px', height: '18px', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;

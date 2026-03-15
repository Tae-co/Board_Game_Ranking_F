import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Plus, Hash } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const Lobby = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen px-6 py-8" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: 'var(--th-bg)' }}>

      {/* Profile Card */}
      <div className="rounded-2xl p-5 mb-6 border shadow-sm" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm mb-1" style={{ color: 'var(--th-text-sub)' }}>{t('lobby', 'greeting')}</p>
            <p className="text-xl" style={{ color: 'var(--th-text)' }}>{nickname}{t('lobby', 'greetingSuffix')}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
              >
                {t('lobby', 'manageGames')}
              </button>
            )}
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 rounded-full text-sm transition-colors"
              style={{ backgroundColor: 'var(--th-bg)', color: 'var(--th-primary)', border: '1px solid var(--th-border)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--th-bg)'}
            >
              {t('lobby', 'profile')}
            </button>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm transition-colors"
          style={{ color: 'var(--th-text-sub)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--th-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--th-text-sub)'}
        >
          <LogOut className="w-4 h-4" />
          {t('common', 'logout')}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => { setMode(mode === 'create' ? null : 'create'); setSelectedGameId(null); setNewRoomName(''); }}
          className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
          style={{
            backgroundColor: mode === 'create' ? 'var(--th-primary)' : 'var(--th-card)',
            color: mode === 'create' ? '#FFFFFF' : 'var(--th-primary)',
            border: '2px solid var(--th-primary)',
          }}
        >
          <Plus className="w-4 h-4" />
          {t('lobby', 'createGroup')}
        </button>
        <button
          onClick={() => { setMode(mode === 'join' ? null : 'join'); setJoinCode(''); }}
          className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
          style={{
            backgroundColor: mode === 'join' ? 'var(--th-primary)' : 'var(--th-card)',
            color: mode === 'join' ? '#FFFFFF' : 'var(--th-primary)',
            border: '2px solid var(--th-primary)',
          }}
        >
          <Hash className="w-4 h-4" />
          {t('lobby', 'joinWithCode')}
        </button>
      </div>

      {/* Create Room Panel */}
      {mode === 'create' && (
        <div className="rounded-2xl p-5 mb-6 border shadow-sm" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--th-text)' }}>{t('lobby', 'createGroup')}</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder={t('lobby', 'groupNamePlaceholder')}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
              style={{ backgroundColor: 'var(--th-bg)', borderColor: 'var(--th-border)', color: 'var(--th-text)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
            />
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--th-text-sub)' }}>{t('lobby', 'selectGame')}</p>
              <div className="grid grid-cols-3 gap-2">
                {games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGameId(game.id)}
                    className="rounded-xl overflow-hidden border-2 transition-all"
                    style={{
                      borderColor: selectedGameId === game.id ? 'var(--th-primary)' : 'var(--th-border)',
                      backgroundColor: 'var(--th-bg)',
                    }}
                  >
                    {game.imageUrl ? (
                      <img src={game.imageUrl} alt={game.name} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square flex items-center justify-center text-2xl">🎲</div>
                    )}
                    <p
                      className="text-xs py-1 truncate px-1"
                      style={{
                        color: selectedGameId === game.id ? 'var(--th-primary)' : 'var(--th-text)',
                        fontWeight: selectedGameId === game.id ? 700 : 400,
                      }}
                    >
                      {game.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleCreateRoom}
              disabled={isSubmitting || !newRoomName.trim() || !selectedGameId}
              className="w-full py-2.5 rounded-full text-sm font-bold transition-opacity disabled:opacity-50"
              style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
            >
              {isSubmitting ? t('lobby', 'creating') : t('lobby', 'createRoom')}
            </button>
          </div>
        </div>
      )}

      {/* Join Room Panel */}
      {mode === 'join' && (
        <div className="rounded-2xl p-5 mb-6 border shadow-sm" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--th-text)' }}>{t('lobby', 'joinWithCode')}</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              placeholder={t('lobby', 'inviteCodePlaceholder')}
              autoFocus
              maxLength={8}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none font-mono tracking-widest uppercase"
              style={{ backgroundColor: 'var(--th-bg)', borderColor: 'var(--th-border)', color: 'var(--th-text)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
            />
            <button
              onClick={handleJoinRoom}
              disabled={isSubmitting || !joinCode.trim()}
              className="w-full py-3 rounded-full text-sm font-bold transition-opacity disabled:opacity-50"
              style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
            >
              {isSubmitting ? '...' : t('lobby', 'join')}
            </button>
          </div>
        </div>
      )}

      {/* Room List */}
      <div className="mt-6">
        <h2 className="text-lg mb-4" style={{ color: 'var(--th-text)' }}>{t('lobby', 'myGroups')}</h2>
        {rooms.length === 0 ? (
          <div className="rounded-2xl p-8 border-2 border-dashed text-center" style={{ borderColor: 'var(--th-border)' }}>
            <p style={{ color: 'var(--th-text-sub)' }}>{t('lobby', 'noGroups')}</p>
            <p className="text-sm mt-2" style={{ color: 'var(--th-text-sub)' }}>{t('lobby', 'noGroupsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <button
                key={room.roomId}
                onClick={() => navigate(`/ranking/${room.roomId}`)}
                className="w-full rounded-2xl p-4 border shadow-sm flex items-center justify-between transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}
              >
                <div className="text-left">
                  <p className="font-semibold" style={{ color: 'var(--th-text)' }}>{room.roomName || room.name}</p>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: 'var(--th-primary)' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;

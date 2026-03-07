import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const Lobby = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const nickname = localStorage.getItem('nickname') || '플레이어';
  const userId = localStorage.getItem('userId');
  const isAdmin = localStorage.getItem('role') === 'ADMIN';

  const fetchRooms = async () => {
    try {
      const res = await api.get(`/rooms/my/${userId}`);
      setRooms(res.data || []);
    } catch (err) {
      console.error('방 목록을 불러오는데 실패했습니다.', err);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) { alert(t('lobby', 'roomNameRequired')); return; }
    try {
      const res = await api.post('/rooms', { roomName: newRoomName, memberId: Number(userId) });
      navigate(`/invite/${res.data.roomId}`);
    } catch {
      alert(t('lobby', 'createFailed'));
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) { alert(t('lobby', 'codeRequired')); return; }
    setIsJoining(true);
    try {
      await api.post('/rooms/join', { inviteCode: joinCode.trim(), memberId: Number(userId) });
      setJoinCode('');
      setShowJoin(false);
      await fetchRooms();
    } catch {
      alert(t('lobby', 'joinFailed'));
    } finally {
      setIsJoining(false);
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
    <div className="min-h-screen px-6 py-8" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: '#FFF8F0' }}>

      {/* Profile Card */}
      <div className="rounded-2xl p-5 mb-6 border shadow-sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm mb-1" style={{ color: '#8B7355' }}>{t('lobby', 'greeting')}</p>
            <p className="text-xl" style={{ color: '#2C1F0E' }}>{nickname}{t('lobby', 'greetingSuffix')}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
              >
                {t('lobby', 'manageGames')}
              </button>
            )}
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 rounded-full text-sm transition-colors"
              style={{ backgroundColor: '#FFF8F0', color: '#D4853A', border: '1px solid #E5D5C0' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5D5C0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFF8F0'}
            >
              {t('lobby', 'profile')}
            </button>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm transition-colors"
          style={{ color: '#8B7355' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#D4853A'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#8B7355'}
        >
          <LogOut className="w-4 h-4" />
          {t('common', 'logout')}
        </button>
      </div>

      {/* Create/Join Room Card */}
      <div className="rounded-2xl p-5 mb-6 border shadow-sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>
        <h2 className="text-lg mb-4" style={{ color: '#2C1F0E' }}>{t('lobby', 'createGroup')}</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
            placeholder={t('lobby', 'roomNamePlaceholder')}
            className="w-full px-4 py-3 rounded-lg border focus:outline-none transition-all"
            style={{ backgroundColor: '#FFF8F0', borderColor: '#E5D5C0', color: '#2C1F0E' }}
            onFocus={(e) => e.target.style.borderColor = '#D4853A'}
            onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateRoom}
              disabled={!newRoomName.trim()}
              className="flex-1 py-3 rounded-full transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
            >
              {t('lobby', 'createRoom')}
            </button>
            <button
              onClick={() => { setShowJoin(!showJoin); setJoinCode(''); }}
              className="flex-1 py-3 rounded-full border transition-colors"
              style={{
                backgroundColor: showJoin ? '#D4853A' : '#FFFFFF',
                color: showJoin ? '#FFFFFF' : '#D4853A',
                borderColor: '#D4853A',
              }}
            >
              {t('lobby', 'joinWithCode')}
            </button>
          </div>
          {showJoin && (
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                placeholder={t('lobby', 'inviteCodePlaceholder')}
                autoFocus
                maxLength={8}
                className="flex-1 px-4 py-3 rounded-lg border focus:outline-none transition-all font-mono tracking-widest uppercase"
                style={{ backgroundColor: '#FFF8F0', borderColor: '#E5D5C0', color: '#2C1F0E' }}
                onFocus={(e) => e.target.style.borderColor = '#D4853A'}
                onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
              />
              <button
                onClick={handleJoinRoom}
                disabled={isJoining || !joinCode.trim()}
                className="px-6 py-3 rounded-full transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
              >
                {isJoining ? t('lobby', 'joining') : t('lobby', 'join')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Room List */}
      <div>
        <h2 className="text-lg mb-4" style={{ color: '#2C1F0E' }}>{t('lobby', 'myGroups')}</h2>
        {rooms.length === 0 ? (
          <div className="rounded-2xl p-8 border-2 border-dashed text-center" style={{ borderColor: '#E5D5C0' }}>
            <p style={{ color: '#8B7355' }}>{t('lobby', 'noGroups')}</p>
            <p className="text-sm mt-2" style={{ color: '#8B7355' }}>{t('lobby', 'noGroupsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <button
                key={room.roomId}
                onClick={() => navigate(`/invite/${room.roomId}`)}
                className="w-full rounded-2xl p-5 border shadow-sm flex items-center justify-between transition-all hover:scale-[1.02]"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}
              >
                <div className="text-left">
                  <p style={{ color: '#2C1F0E' }}>{room.roomName || room.name}</p>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: '#D4853A' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;

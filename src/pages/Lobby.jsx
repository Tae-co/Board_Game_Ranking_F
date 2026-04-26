import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Plus, Users } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api, { setAccessToken } from '../api/axios';
import { clearAuthSession } from '../auth/storage';
import { useLanguage } from '../i18n/LanguageContext';

const V = (v) => `var(${v})`;

const DiceLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="28" height="28">
    <defs>
      <linearGradient id="lobbyDiceTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#90C4F9"/>
        <stop offset="100%" stopColor="#7B6CF6"/>
      </linearGradient>
      <linearGradient id="lobbyDiceLeft" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6B5CE7"/>
        <stop offset="100%" stopColor="#4835B0"/>
      </linearGradient>
      <linearGradient id="lobbyDiceRight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#9B8EFA"/>
        <stop offset="100%" stopColor="#7060E0"/>
      </linearGradient>
    </defs>
    <polygon points="50,10 84,29 50,48 16,29" fill="url(#lobbyDiceTop)"/>
    <polygon points="16,29 50,48 50,88 16,69" fill="url(#lobbyDiceLeft)"/>
    <polygon points="84,29 50,48 50,88 84,69" fill="url(#lobbyDiceRight)"/>
    <circle cx="37" cy="24" r="3.8" fill="#fff" opacity="0.92"/>
    <circle cx="63" cy="38" r="3.8" fill="#fff" opacity="0.92"/>
    <circle cx="27" cy="46" r="3.2" fill="#fff" opacity="0.85"/>
    <circle cx="39" cy="53" r="3.2" fill="#fff" opacity="0.85"/>
    <circle cx="27" cy="64" r="3.2" fill="#fff" opacity="0.85"/>
    <circle cx="39" cy="71" r="3.2" fill="#fff" opacity="0.85"/>
    <circle cx="72" cy="44" r="3.2" fill="#fff" opacity="0.85"/>
    <circle cx="64" cy="58" r="3.2" fill="#fff" opacity="0.85"/>
    <circle cx="72" cy="72" r="3.2" fill="#fff" opacity="0.85"/>
  </svg>
);

const Lobby = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const sheetRef = useRef(null);
  const nickname = localStorage.getItem('nickname') || '플레이어';
  const userId = localStorage.getItem('userId');
  const selectedCommunity = (() => {
    try { return JSON.parse(localStorage.getItem('selectedCommunity')); } catch { return null; }
  })();
  const communityId = selectedCommunity?.communityId ?? null;
  const isAdmin = selectedCommunity?.isAdmin ?? false;

  const { data: rooms = [] } = useQuery({
    queryKey: communityId ? ['communityRooms', communityId, userId] : ['rooms', userId],
    queryFn: async () => {
      if (!userId || userId === 'null') return [];
      if (communityId) {
        const res = await api.get(`/communities/${communityId}/rooms?memberId=${userId}`);
        return res.data || [];
      }
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
    enabled: !communityId && rooms.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  const handleEnterRoom = async (room) => {
    if (communityId && !room.isMember) {
      try {
        await api.post('/rooms/join', { inviteCode: room.inviteCode, memberId: Number(userId) });
        queryClient.invalidateQueries({ queryKey: ['communityRooms', communityId, userId] });
      } catch { /* 이미 멤버인 경우 무시 */ }
    }
    navigate(`/invite/${room.roomId}`);
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    try {
      await api.post('/rooms/join', { inviteCode: joinCode.trim(), memberId: Number(userId) });
      setJoinCode('');
      setShowJoinSheet(false);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    } catch {
      alert(t('lobby', 'joinFailed'));
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (!showJoinSheet) return;
    const handle = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) setShowJoinSheet(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showJoinSheet]);

  useEffect(() => {
    if (!showJoinSheet) return;
    const handle = (e) => { if (e.key === 'Escape') setShowJoinSheet(false); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [showJoinSheet]);

  return (
    <div style={{ minHeight: '100vh', maxWidth: '390px', margin: '0 auto', backgroundColor: V('--th-bg') }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: V('--th-nav-bg'),
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {selectedCommunity ? (
          <button
            onClick={() => navigate('/community')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={22} color="var(--th-primary)" />
            <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)' }}>
              {selectedCommunity.name}
            </span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DiceLogo />
            <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)' }}>
              Yada Rank
            </span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAdmin && (
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--th-text-sub)' }}>
              Admin
            </span>
          )}
          <div
            onClick={() => navigate('/profile')}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              backgroundColor: 'var(--th-primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 15, cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(123,108,246,0.3)',
            }}
          >
            {(nickname || '?')[0].toUpperCase()}
          </div>
        </div>
      </div>


      <div style={{ padding: '4px 20px 24px' }}>

        {/* Welcome Banner */}
        <div style={{
          borderRadius: '20px',
          padding: '24px 22px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -20, bottom: -20,
            width: 120, height: 120, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.07)',
          }}/>
          <div style={{
            position: 'absolute', right: 30, top: -30,
            width: 80, height: 80, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}/>
          <p style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            Hi, {nickname}!
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
            Ready to manage your collectives<br/>today?
          </p>
        </div>

        {/* Action Buttons — 커뮤니티 모드에서는 숨김 */}
        {!communityId && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            <button
              onClick={() => navigate('/create-group')}
              style={{
                padding: '20px 16px', borderRadius: '18px', cursor: 'pointer',
                backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px',
                textAlign: 'left', transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--th-primary)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(107,92,231,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--th-border)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '1.5px solid var(--th-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus style={{ color: V('--th-text'), width: 18, height: 18 }} />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: V('--th-text'), marginBottom: '3px' }}>
                  {t('lobby', 'createGroup')}
                </div>
                <div style={{ fontSize: '11px', color: V('--th-text-sub') }}>
                  Start a new circle
                </div>
              </div>
            </button>

            <button
              onClick={() => { setJoinCode(''); setShowJoinSheet(true); }}
              style={{
                padding: '20px 16px', borderRadius: '18px', cursor: 'pointer',
                backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px',
                textAlign: 'left', transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--th-primary)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(107,92,231,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--th-border)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '1.5px solid var(--th-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users style={{ color: V('--th-text'), width: 18, height: 18 }} />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: V('--th-text'), marginBottom: '3px' }}>
                  {t('lobby', 'joinWithCode')}
                </div>
                <div style={{ fontSize: '11px', color: V('--th-text-sub') }}>
                  Enter a shared ID
                </div>
              </div>
            </button>
          </div>
        )}

        {/* My Groups / Community Groups */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <p style={{ fontSize: '17px', fontWeight: '800', color: V('--th-text'), margin: 0 }}>
              {communityId ? t('community', 'communityGroups') : t('lobby', 'myGroups')}
            </p>
            {/* 커뮤니티 모드 + Admin: 그룹 생성 버튼 */}
            {communityId && isAdmin && (
              <button
                onClick={() => navigate('/create-group')}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(107,92,231,0.3)',
                }}
              >
                <Plus size={16} color="#fff" />
              </button>
            )}
          </div>

          {rooms.length === 0 ? (
            <div style={{
              borderRadius: '16px', padding: '40px 20px', border: `2px dashed var(--th-border)`,
              textAlign: 'center',
            }}>
              <p style={{ color: V('--th-text-sub'), fontSize: '14px', margin: '0 0 6px' }}>{t('lobby', 'noGroups')}</p>
              <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: 0 }}>{t('lobby', 'noGroupsDesc')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rooms.map((room) => {
                const gameInfo = !communityId ? games.find(g => g.id === room.boardGameId) : null;
                const imageUrl = communityId ? room.imageUrl : gameInfo?.imageUrl;
                const isMember = communityId ? room.isMember : true;
                return (
                  <div
                    key={room.roomId}
                    style={{
                      width: '100%', borderRadius: '16px', padding: '14px 16px',
                      backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                      display: 'flex', alignItems: 'center', gap: '14px',
                      boxSizing: 'border-box',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    {/* Game image */}
                    <div
                      onClick={() => handleEnterRoom(room)}
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={room.roomName}
                          style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: 48, height: 48, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6B5CE7, #9B8EFA)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                        }}>
                          🎲
                        </div>
                      )}
                    </div>

                    {/* Room info */}
                    <div
                      onClick={() => handleEnterRoom(room)}
                      style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: '700', color: V('--th-text'), fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {room.roomName}
                      </div>
                      {communityId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                            backgroundColor: room.sessionActive ? '#22c55e' : 'var(--th-text-sub)',
                          }}/>
                          <span style={{ fontSize: '12px', color: V('--th-text-sub'), fontWeight: '500' }}>
                            {room.sessionActive ? t('community', 'activeSession') : t('community', 'inactiveSession')}
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: V('--th-text-sub'), marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users style={{ width: 12, height: 12 }} />
                          <span>{room.memberCount ?? '—'} members</span>
                        </div>
                      )}
                    </div>

                    {/* 커뮤니티 모드: 참여 상태 표시 */}
                    {communityId ? (
                      isMember ? (
                        <span style={{
                          fontSize: '11px', fontWeight: '700', color: 'var(--th-primary)',
                          backgroundColor: 'rgba(107,92,231,0.1)',
                          padding: '4px 10px', borderRadius: '20px', flexShrink: 0,
                        }}>
                          {t('community', 'joinedBadge')}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEnterRoom(room); }}
                          style={{
                            fontSize: '12px', fontWeight: '700', color: '#fff',
                            background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                            border: 'none', borderRadius: '20px',
                            padding: '5px 12px', cursor: 'pointer', flexShrink: 0,
                          }}
                        >
                          {t('community', 'enterRoom')}
                        </button>
                      )
                    ) : (
                      <ChevronRight
                        onClick={() => handleEnterRoom(room)}
                        style={{ color: V('--th-text-sub'), width: 18, height: 18, flexShrink: 0, cursor: 'pointer' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Join Code Bottom Sheet */}
      {showJoinSheet && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 50, display: 'flex', alignItems: 'flex-end',
        }}>
          <div
            ref={sheetRef}
            style={{
              width: '100%', maxWidth: '390px', margin: '0 auto',
              backgroundColor: V('--th-card'),
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px',
            }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: V('--th-border'), margin: '0 auto 24px' }} />

            <h3 style={{ fontSize: '18px', fontWeight: '700', color: V('--th-text'), marginBottom: '6px' }}>
              {t('lobby', 'enterGroupCode')}
            </h3>
            <p style={{ fontSize: '13px', color: V('--th-text-sub'), marginBottom: '20px' }}>
              {t('lobby', 'enterGroupCodeHint')}
            </p>

            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              placeholder={t('lobby', 'inviteCodePlaceholder')}
              autoFocus
              maxLength={8}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                textAlign: 'center', fontFamily: 'monospace', fontSize: '22px',
                letterSpacing: '0.3em', fontWeight: '700', outline: 'none',
                backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)`,
                color: V('--th-primary'), boxSizing: 'border-box', marginBottom: '12px',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
            />

            <button
              onClick={handleJoinRoom}
              disabled={isJoining || !joinCode.trim()}
              style={{
                width: '100%', padding: '15px', borderRadius: '50px',
                background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                color: '#fff', fontWeight: '700', fontSize: '15px',
                border: 'none', cursor: 'pointer',
                opacity: (isJoining || !joinCode.trim()) ? 0.5 : 1,
              }}
            >
              {isJoining ? '...' : t('lobby', 'joinGroup')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;

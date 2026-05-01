import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, MoreVertical, X, Trophy, Users, Check } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';
import { usePresence } from '../hooks/usePresence';

const V = (v) => `var(${v})`;
const myNickname = () => localStorage.getItem('nickname') || '?';

const avatarColors = [
  '#6B5CE7', '#7B8FF5', '#A78BFA', '#60A5FA', '#34D399',
  '#F472B6', '#FB923C', '#FBBF24', '#38BDF8', '#4ADE80',
];
const getAvatarColor = (memberId) => avatarColors[memberId % avatarColors.length];

const MemberRow = ({ member, isMe, showKebab, isHost, openKebab, setOpenKebab, onKick, onLeave, t, isOnline, isSelected, onToggle }) => (
  <div
    onClick={onToggle}
    style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 10px', borderRadius: '12px',
      position: 'relative', cursor: 'pointer',
      backgroundColor: isSelected ? 'rgba(107,92,231,0.07)' : 'transparent',
      border: `1.5px solid ${isSelected ? 'var(--th-primary)' : 'transparent'}`,
      transition: 'all 0.15s',
      marginBottom: '4px',
    }}>
    <div style={{ position: 'relative', flexShrink: 0, width: 44, height: 44 }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        backgroundColor: isSelected ? 'var(--th-primary)' : getAvatarColor(member.memberId),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: '700', color: '#FFFFFF',
        transition: 'background-color 0.15s',
        overflow: 'hidden',
      }}>
        {member.profileImage
          ? <img src={member.profileImage} alt={member.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : member.nickname[0].toUpperCase()
        }
      </div>
      <div style={{
        position: 'absolute', bottom: 1, right: 1,
        width: 11, height: 11, borderRadius: '50%',
        backgroundColor: isOnline ? '#22c55e' : '#9ca3af',
        border: '2px solid var(--th-bg)',
        zIndex: 1,
      }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: '15px', fontWeight: isSelected ? '700' : (isMe ? '700' : '600'),
        color: isSelected ? 'var(--th-primary)' : (isMe ? 'var(--th-primary)' : V('--th-text')),
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {member.nickname}
      </div>
      <div style={{
        fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em',
        color: member.isHost ? 'var(--th-primary)' : V('--th-text-sub'), marginTop: '1px',
      }}>
        {member.isHost ? 'HOST' : 'PLAYER'}
      </div>
    </div>
    {isSelected && (
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        backgroundColor: 'var(--th-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Check style={{ color: '#fff', width: 13, height: 13 }} />
      </div>
    )}
    {showKebab && (
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); setOpenKebab(openKebab === member.memberId ? null : member.memberId); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: V('--th-text-sub') }}
        >
          <MoreVertical style={{ width: 18, height: 18 }} />
        </button>
        {openKebab === member.memberId && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', zIndex: 20,
            backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
            borderRadius: '12px', overflow: 'hidden', minWidth: '130px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}>
            {isHost ? (
              <button
                onClick={(e) => { e.stopPropagation(); onKick(member); }}
                style={{ width: '100%', padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {t('invite', 'kick')}
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onLeave(); }}
                style={{ width: '100%', padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {t('invite', 'leaveRoom')}
              </button>
            )}
          </div>
        )}
      </div>
    )}
  </div>
);

const Invite = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const userId = Number(localStorage.getItem('userId'));
  const onlineIds = usePresence(userId, roomId);

  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [openKebab, setOpenKebab] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editRoomName, setEditRoomName] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: roomInfo = {}, refetch: refetchRoom } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 10,
    initialData: () => {
      const cachedRooms = queryClient.getQueryData(['rooms', String(userId)]);
      const found = cachedRooms?.find(r => String(r.roomId) === String(roomId));
      return found ?? undefined;
    },
  });

  const roomName = roomInfo.roomName || '';


  const { data: members = [], refetch: refetchMembers } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/members`);
      return res.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const isHost = members.find(m => m.memberId === userId)?.isHost ?? false;

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => { const res = await api.get('/games'); return res.data || []; },
    enabled: !!roomInfo.boardGameId,
    staleTime: 1000 * 60 * 30,
  });
  const gameInfo = games.find(g => g.id === roomInfo.boardGameId) ?? null;

  const minPlayers = gameInfo?.minPlayers ?? 2;
  const maxPlayers = gameInfo?.maxPlayers ?? 99;
  const canStart = selectedPlayers.size >= minPlayers && selectedPlayers.size <= maxPlayers;

  const togglePlayer = (memberId) => {
    setSelectedPlayers(prev => {
      const next = new Set(prev);
      next.has(memberId) ? next.delete(memberId) : next.add(memberId);
      return next;
    });
  };

  const handleStartGame = () => {
    if (!canStart) return;
    navigate(`/score-sheet/${roomInfo.boardGameId}`, {
      state: {
        roomId,
        gameName: gameInfo?.name || '',
        players: members.filter(m => selectedPlayers.has(m.memberId)),
      },
    });
  };

  const handleLeaveRoom = async () => {
    if (!window.confirm(t('invite', 'leaveConfirm'))) return;
    try {
      await api.delete(`/rooms/${roomId}/members/${userId}`);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      navigate('/lobby');
    } catch { alert(t('invite', 'leaveFailed')); }
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm(t('invite', 'deleteConfirm'))) return;
    try {
      await api.delete(`/rooms/${roomId}`);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      navigate('/lobby');
    } catch { alert(t('invite', 'deleteFailed')); }
  };

  const handleKickMember = async (member) => {
    if (!window.confirm(`${member.nickname}${t('invite', 'kickConfirm')}`)) return;
    try {
      await api.delete(`/rooms/${roomId}/members/${member.memberId}`);
      refetchMembers();
    } catch { alert(t('invite', 'kickFailed')); }
    setOpenKebab(null);
  };

  const handleSaveSettings = async () => {
    const trimmed = editRoomName.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await api.patch(`/rooms/${roomId}/name`, { requesterId: userId, roomName: trimmed });
      await refetchRoom();
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setShowSettings(false);
    } catch { alert('방 이름 변경에 실패했습니다.'); }
    setSaving(false);
  };

  const openSettings = () => {
    setEditRoomName(roomName);
    setShowSettings(true);
  };

  useEffect(() => {
    if (!openKebab) return;
    const handle = () => setOpenKebab(null);
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [openKebab]);

  return (
    <div style={{ minHeight: '100vh', maxWidth: '390px', margin: '0 auto', backgroundColor: V('--th-bg'), paddingBottom: 100 }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: V('--th-nav-bg'), position: 'sticky', top: 0, zIndex: 10,
        borderBottom: `1px solid var(--th-border)`,
      }}>
        <button
          onClick={() => navigate('/lobby')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--th-primary)' }}
        >
          <ArrowLeft style={{ width: 24, height: 24 }} />
        </button>
        <h1 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)', margin: 0 }}>
          Group Lobby
        </h1>
        <NavAvatar />
      </div>

      <div style={{ padding: '20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Board Game Card */}
        {gameInfo && (
          <div style={{
            borderRadius: '18px', overflow: 'hidden',
            position: 'relative', height: '240px',
            border: '2px solid rgba(107,92,231,0.35)',
            boxShadow: '0 4px 20px rgba(107,92,231,0.18)',
          }}>
            <img
              src={gameInfo.imageUrl}
              alt={gameInfo.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '16px 18px',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '0 0 5px', letterSpacing: '0.02em' }}>
                  {gameInfo.name.toUpperCase()}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Users size={13} color="rgba(255,255,255,0.75)" />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>
                    {gameInfo.minPlayers}-{gameInfo.maxPlayers} Players
                  </span>
                </div>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em',
                color: '#fff', backgroundColor: 'var(--th-primary)',
                padding: '5px 13px', borderRadius: '20px',
              }}>
                STRATEGY
              </span>
            </div>
          </div>
        )}

        {/* Members */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text') }}>
              {t('invite', 'members')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Ranking button */}
              <button
                onClick={() => navigate(`/ranking/${roomId}`)}
                style={{
                  background: 'none', border: 'none', padding: '4px', display: 'flex', alignItems: 'center',
                  cursor: 'pointer', color: V('--th-text-sub'),
                }}
              >
                <Trophy style={{ width: 20, height: 20 }} />
              </button>
              {/* Settings icon — visible to all, clickable by host only */}
              <button
                onClick={isHost ? openSettings : undefined}
                style={{
                  background: 'none', border: 'none', padding: '4px', display: 'flex', alignItems: 'center',
                  cursor: isHost ? 'pointer' : 'default',
                  color: isHost ? V('--th-text-sub') : 'color-mix(in srgb, var(--th-text-sub) 40%, transparent)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </button>
              <span style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text-sub') }}>{members.length}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {members.map((member) => {
              const isMe = member.memberId === userId;
              const showKebab = isHost ? (!isMe && !member.isHost) : isMe;
              return (
                <MemberRow
                  key={member.memberId}
                  member={member}
                  isMe={isMe}
                  showKebab={showKebab}
                  isHost={isHost}
                  openKebab={openKebab}
                  setOpenKebab={setOpenKebab}
                  onKick={handleKickMember}
                  onLeave={handleLeaveRoom}
                  t={t}
                  isOnline={onlineIds.has(member.memberId)}
                  isSelected={selectedPlayers.has(member.memberId)}
                  onToggle={() => togglePlayer(member.memberId)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Start Game Button */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '390px', padding: '10px 20px 28px',
        backgroundColor: V('--th-nav-bg'), borderTop: `1px solid var(--th-border)`,
      }}>
        {selectedPlayers.size > maxPlayers && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#ef4444', margin: '0 0 6px' }}>
            {t('gameSelect', 'maxPlayersError').replace('{n}', maxPlayers)}
          </p>
        )}
        <button
          onClick={handleStartGame}
          disabled={!canStart}
          style={{
            width: '100%', padding: '15px', borderRadius: '50px',
            cursor: canStart ? 'pointer' : 'not-allowed',
            background: canStart
              ? 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)'
              : V('--th-border'),
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: canStart ? '0 4px 16px rgba(107, 92, 231, 0.4)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <Play style={{ color: '#FFFFFF', width: 18, height: 18, fill: '#FFFFFF' }} />
          <span style={{ fontWeight: '700', fontSize: '15px', color: '#FFFFFF' }}>
            {selectedPlayers.size > 0
              ? `${selectedPlayers.size}${t('gameSelect', 'startButton')}`
              : `${minPlayers}${t('invite', 'startGame')}`}
          </span>
        </button>
      </div>

      {/* Group Settings Full-screen Overlay (host only) */}
      {showSettings && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          backgroundColor: V('--th-bg'),
          maxWidth: '390px', left: '50%', transform: 'translateX(-50%)',
          overflowY: 'auto', paddingBottom: 100,
        }}>
          {/* Settings Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10,
            backgroundColor: V('--th-nav-bg'),
            borderBottom: `1px solid var(--th-border)`,
          }}>
            <button
              onClick={() => setShowSettings(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--th-primary)' }}
            >
              <ArrowLeft style={{ width: 24, height: 24 }} />
            </button>
            <h1 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)', margin: 0 }}>
              Manage Group
            </h1>
            <div
              onClick={() => navigate('/profile')}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                backgroundColor: 'var(--th-primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              {myNickname()[0].toUpperCase()}
            </div>
          </div>

          <div style={{ padding: '20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Group Identity */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: V('--th-text'), margin: 0 }}>
                Group identity
              </h2>
              <span style={{
                fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em',
                padding: '4px 12px', borderRadius: '20px',
                backgroundColor: 'color-mix(in srgb, var(--th-primary) 12%, transparent)',
                color: 'var(--th-primary)', border: '1px solid var(--th-primary)',
              }}>
                ACTIVE SESSION
              </span>
            </div>

            {/* Room Name Input */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', color: V('--th-text-sub'), display: 'block', marginBottom: '8px' }}>
                GROUP NAME
              </label>
              <input
                value={editRoomName}
                onChange={(e) => setEditRoomName(e.target.value)}
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: '12px',
                  border: `1px solid var(--th-border)`, backgroundColor: V('--th-bg'),
                  color: V('--th-text'), fontSize: '15px', fontWeight: '600',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Members */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text') }}>
                  {t('invite', 'members')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: V('--th-text-sub') }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text-sub') }}>{members.length}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {members.map((member) => {
                  const isMe = member.memberId === userId;
                  const canKick = !isMe && !member.isHost;
                  return (
                    <div
                      key={member.memberId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 8px', borderBottom: `1px solid var(--th-border)`,
                      }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0, width: 44, height: 44 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%',
                          backgroundColor: getAvatarColor(member.memberId),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', fontWeight: '700', color: '#FFFFFF',
                          overflow: 'hidden',
                        }}>
                          {member.profileImage
                            ? <img src={member.profileImage} alt={member.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : member.nickname[0].toUpperCase()
                          }
                        </div>
                        <div style={{
                          position: 'absolute', bottom: 1, right: 1,
                          width: 11, height: 11, borderRadius: '50%',
                          backgroundColor: onlineIds.has(member.memberId) ? '#22c55e' : '#9ca3af',
                          border: '2px solid var(--th-bg)',
                        }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '15px', fontWeight: isMe ? '700' : '600',
                          color: isMe ? 'var(--th-primary)' : V('--th-text'),
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {member.nickname}
                        </div>
                        <div style={{
                          fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em',
                          color: member.isHost ? 'var(--th-primary)' : V('--th-text-sub'), marginTop: '1px',
                        }}>
                          {member.isHost ? 'HOST' : 'PLAYER'}
                        </div>
                      </div>
                      {canKick && (
                        <button
                          onClick={() => handleKickMember(member)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '6px', borderRadius: '8px', flexShrink: 0,
                            color: '#ef4444', display: 'flex', alignItems: 'center',
                          }}
                        >
                          <X style={{ width: 18, height: 18 }} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Settings Bottom Buttons */}
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '390px', padding: '12px 20px 28px',
            backgroundColor: V('--th-bg'), display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <button
              onClick={handleDeleteRoom}
              style={{
                width: '100%', padding: '14px', borderRadius: '50px',
                backgroundColor: 'transparent', color: '#ef4444',
                border: '1.5px solid #ef4444', cursor: 'pointer',
                fontSize: '14px', fontWeight: '700',
              }}
            >
              Delete Group
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving || !editRoomName.trim()}
              style={{
                width: '100%', padding: '15px', borderRadius: '50px', cursor: saving ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                border: 'none', opacity: saving ? 0.7 : 1,
                fontSize: '15px', fontWeight: '700', color: '#FFFFFF',
                boxShadow: '0 4px 16px rgba(107, 92, 231, 0.4)',
              }}
            >
              {saving ? 'Saving...' : 'Save the change'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invite;

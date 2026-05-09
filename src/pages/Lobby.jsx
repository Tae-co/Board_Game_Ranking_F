import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Copy, CheckCheck, Settings } from 'lucide-react';
import NavAvatar from '../components/NavAvatar';
import StorageImage from '../components/StorageImage';
import { QRCodeSVG } from 'qrcode.react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api, { setAccessToken } from '../api/axios';
import { clearAuthSession } from '../auth/storage';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import RoomCard from '../components/lobby/RoomCard';
import JoinCodeSheet from '../components/lobby/JoinCodeSheet';

const DiceLogo = () => (
  <img src="/logo.png" width="28" height="28" style={{ objectFit: 'contain' }} alt="logo" />
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
  const [selectedCommunity, setSelectedCommunity] = useState(() => {
    try { return JSON.parse(localStorage.getItem('selectedCommunity')); } catch { return null; }
  });
  useEffect(() => {
    const handler = () => {
      try { setSelectedCommunity(JSON.parse(localStorage.getItem('selectedCommunity'))); }
      catch { setSelectedCommunity(null); }
    };
    window.addEventListener('selectedCommunityUpdated', handler);
    return () => window.removeEventListener('selectedCommunityUpdated', handler);
  }, []);
  const communityId = selectedCommunity?.communityId ?? null;
  const isAdmin = selectedCommunity?.isAdmin ?? false;
  const communityInviteCode = selectedCommunity?.inviteCode ?? null;
  const [codeCopied, setCodeCopied] = useState(false);
  const [roomPage, setRoomPage] = useState(0);
  const [memberPage, setMemberPage] = useState(0);

  const ROOMS_PER_PAGE = 9;   // 3열 × 3행
  const MEMBERS_PER_PAGE = 15; // 5열 × 3행

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
    enabled: !communityId,
    staleTime: 1000 * 60 * 30,
  });

  const { data: communityMembers = [] } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: async () => {
      const res = await api.get(`/communities/${communityId}/members`);
      return res.data || [];
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 5,
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
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
      <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
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
          <NavAvatar />
        </div>
      </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 24px' }}>

        {/* Banner */}
        {communityId ? (
          /* Community Hero Card */
          <div style={{
            borderRadius: '20px',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
            height: '200px',
            backgroundColor: '#2a1f6e',
            boxShadow: '0 4px 20px rgba(107,92,231,0.25)',
          }}>
            {selectedCommunity?.imageUrl ? (
              <StorageImage
                src={selectedCommunity.imageUrl}
                alt={selectedCommunity.name}
                loading="eager"
                decoding="async"
                transform={{ width: 780, height: 400, quality: 72 }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)' }} />
            )}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '16px 20px',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                  {selectedCommunity?.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Users style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.8)' }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
                    {selectedCommunity?.memberCount ?? 0} Members
                  </span>
                </div>
              </div>
              {selectedCommunity?.region && (
                <div style={{
                  backgroundColor: 'var(--th-primary)',
                  borderRadius: '20px', padding: '6px 14px',
                  fontSize: '11px', fontWeight: '700', color: '#fff',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  boxShadow: '0 2px 8px rgba(107,92,231,0.5)',
                }}>
                  {selectedCommunity.region}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Default Welcome Banner */
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
        )}

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

        {/* 초대 코드 — 커뮤니티 모드에서만 표시 */}
        {communityId && communityInviteCode && (
          <div style={{
            backgroundColor: V('--th-card'), borderRadius: '18px',
            border: `1px solid var(--th-border)`, padding: '20px',
            marginBottom: '24px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: V('--th-text-sub'), margin: '0 0 16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {t('community', 'inviteCode')}
            </p>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: '#fff', flexShrink: 0 }}>
                <QRCodeSVG value={communityInviteCode} size={90} bgColor="#ffffff" fgColor="#1a1a2e" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'monospace', fontSize: '28px', fontWeight: '800',
                  letterSpacing: '0.15em', color: V('--th-primary'), marginBottom: '12px',
                }}>
                  {communityInviteCode}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(communityInviteCode);
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 2000);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: codeCopied ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                    color: codeCopied ? '#22c55e' : '#fff',
                    fontSize: '13px', fontWeight: '700', transition: 'all 0.2s',
                  }}
                >
                  {codeCopied ? <><CheckCheck size={14} />{t('community', 'copyCode')}</> : <><Copy size={14} />{t('community', 'copyCode')}</>}
                </button>
              </div>
            </div>
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
          ) : (() => {
            const totalRoomPages = Math.ceil(rooms.length / ROOMS_PER_PAGE);
            const pagedRooms = rooms.slice(roomPage * ROOMS_PER_PAGE, (roomPage + 1) * ROOMS_PER_PAGE);
            return (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                }}>
                  {pagedRooms.map((room) => {
                    const gameInfo = !communityId ? games.find(g => g.id === room.boardGameId) : null;
                    const imageUrl = communityId ? room.imageUrl : gameInfo?.imageUrl;
                    const isMember = communityId ? room.isMember : true;
                    return (
                      <RoomCard
                        key={room.roomId}
                        room={room}
                        imageUrl={imageUrl}
                        isMember={isMember}
                        communityId={communityId}
                        onClick={() => handleEnterRoom(room)}
                      />
                    );
                  })}
                </div>

                {totalRoomPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '16px' }}>
                    {Array.from({ length: totalRoomPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setRoomPage(i)}
                        style={{
                          width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
                          fontSize: '13px', fontWeight: '700',
                          backgroundColor: roomPage === i ? 'var(--th-primary)' : 'var(--th-card)',
                          color: roomPage === i ? '#fff' : V('--th-text-sub'),
                          border: `1px solid ${roomPage === i ? 'var(--th-primary)' : 'var(--th-border)'}`,
                          transition: 'all 0.15s',
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Community Members */}
        {communityId && (
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--th-primary)" />
                <p style={{ fontSize: '17px', fontWeight: '800', color: V('--th-text'), margin: 0 }}>
                  {t('community', 'communityMembers')}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: V('--th-text-sub'), fontWeight: '600' }}>
                  {communityMembers.length}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => navigate('/community-members')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      color: V('--th-text-sub'), display: 'flex', alignItems: 'center',
                    }}
                  >
                    <Settings size={18} />
                  </button>
                )}
              </div>
            </div>

            {communityMembers.length === 0 ? (
              <p style={{ fontSize: '14px', color: V('--th-text-sub'), textAlign: 'center', padding: '20px 0' }}>
                {t('community', 'noCommunityMembers')}
              </p>
            ) : (() => {
              const totalMemberPages = Math.ceil(communityMembers.length / MEMBERS_PER_PAGE);
              const pagedMembers = communityMembers.slice(memberPage * MEMBERS_PER_PAGE, (memberPage + 1) * MEMBERS_PER_PAGE);
              return (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '10px 6px',
                  }}>
                    {pagedMembers.map((member) => {
                      const colors = ['#6B5CE7','#F5A623','#22c55e','#3B82F6','#EF4444','#EC4899','#14B8A6','#F97316'];
                      const color = colors[member.memberId % colors.length];
                      const isMe = String(member.memberId) === String(userId);
                      return (
                        <div key={member.memberId} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                        }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            backgroundColor: color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 17, color: '#fff',
                            border: isMe ? '2.5px solid var(--th-primary)' : '2.5px solid transparent',
                            boxSizing: 'border-box',
                            boxShadow: isMe ? '0 0 0 2px rgba(107,92,231,0.25)' : 'none',
                            overflow: 'hidden',
                          }}>
                            {member.profileImage
                              ? <StorageImage src={member.profileImage} alt={member.nickname} loading="lazy" decoding="async" transform={{ width: 88, height: 88, quality: 70 }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              : member.nickname[0].toUpperCase()
                            }
                          </div>
                          <span style={{
                            fontSize: '10px', fontWeight: isMe ? '700' : '500',
                            color: isMe ? V('--th-primary') : V('--th-text'),
                            textAlign: 'center', width: '100%',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {member.nickname}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {totalMemberPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '14px' }}>
                      {Array.from({ length: totalMemberPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setMemberPage(i)}
                          style={{
                            width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                            fontSize: '13px', fontWeight: '700',
                            backgroundColor: memberPage === i ? 'var(--th-primary)' : 'var(--th-card)',
                            color: memberPage === i ? '#fff' : V('--th-text-sub'),
                            border: `1px solid ${memberPage === i ? 'var(--th-primary)' : 'var(--th-border)'}`,
                            transition: 'all 0.15s',
                          }}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {showJoinSheet && (
        <JoinCodeSheet
          sheetRef={sheetRef}
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          isJoining={isJoining}
          onJoin={handleJoinRoom}
          t={t}
        />
      )}
    </div>
  );
};

export default Lobby;

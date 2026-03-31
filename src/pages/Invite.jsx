import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, ArrowLeft, Check, Share2, Gamepad2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

const V = (v) => `var(${v})`;

const Invite = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const userId = Number(localStorage.getItem('userId'));

  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const qrRef = useRef(null);
  const qrInstanceRef = useRef(null);

  const { data: roomInfo = {} } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 10,
    initialData: () => {
      const cachedRooms = queryClient.getQueryData(['rooms', userId]);
      const found = cachedRooms?.find(r => String(r.roomId) === String(roomId));
      return found ?? undefined;
    },
  });

  const roomName = roomInfo.roomName || '';

  useEffect(() => {
    if (!roomInfo.inviteCode || !qrRef.current) return;
    const loadQR = () => {
      if (qrInstanceRef.current) {
        qrInstanceRef.current.clear();
        qrInstanceRef.current.makeCode(`https://boardup.pages.dev/join?code=${roomInfo.inviteCode}`);
        return;
      }
      qrInstanceRef.current = new window.QRCode(qrRef.current, {
        text: `https://boardup.pages.dev/join?code=${roomInfo.inviteCode}`,
        width: 120, height: 120,
        colorDark: '#0F172A', colorLight: '#FFFFFF',
      });
    };
    if (window.QRCode) { loadQR(); }
    else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.onload = loadQR;
      document.head.appendChild(script);
    }
  }, [roomInfo.inviteCode]);

  const { data: members = [], refetch: refetchMembers } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/members`);
      return res.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: rankings = [] } = useQuery({
    queryKey: ['rankings', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/rankings`);
      return res.data || [];
    },
    staleTime: 1000 * 60 * 3,
  });

  const isHost = members.find(m => m.memberId === userId)?.isHost ?? false;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomInfo.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = `https://boardup.pages.dev/join?code=${roomInfo.inviteCode}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: roomName, text: `${roomName} ${t('invite', 'shareText')}`, url: shareUrl });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch { /* 사용자 취소 */ }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
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
  };

  const top3 = rankings.slice(0, 3);

  return (
    <div className="min-h-screen pb-8" style={{ maxWidth: '430px', margin: '0 auto', backgroundColor: V('--th-bg') }}>
      {/* Dot pattern */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'radial-gradient(circle, var(--th-dot) 1px, transparent 1px)',
        backgroundSize: '24px 24px', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/lobby')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px', padding: '6px' }}
            >
              <ArrowLeft style={{ color: V('--th-primary'), width: '24px', height: '24px' }} />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '600', color: V('--th-text') }}>{roomName}</h1>
          </div>
          {isHost ? (
            <button onClick={handleDeleteRoom} style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
              {t('invite', 'deleteRoom')}
            </button>
          ) : (
            <button onClick={handleLeaveRoom} style={{ fontSize: '13px', color: V('--th-text-sub'), background: 'none', border: 'none', cursor: 'pointer' }}>
              {t('invite', 'leaveRoom')}
            </button>
          )}
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Room Header Card */}
          <div style={{ borderRadius: '16px', padding: '20px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.15em', color: V('--th-text-sub'), marginBottom: '4px' }}>PRIVATE ROOM</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: V('--th-text'), marginBottom: '4px' }}>{roomName}</h2>
                <p style={{ fontSize: '12px', color: V('--th-text-sub') }}>{members.length} Members</p>
              </div>
              <div style={{ fontSize: '28px' }}>🏆</div>
            </div>

            {/* Invite Code */}
            <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: V('--th-bg'), border: `1px solid var(--th-border)` }}>
              <p style={{ fontSize: '10px', letterSpacing: '0.15em', color: V('--th-text-sub'), marginBottom: '6px' }}>INVITE CODE</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '700', color: V('--th-text'), letterSpacing: '0.2em' }}>
                  {roomInfo.inviteCode || '------'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleCopyCode}
                    style={{
                      padding: '6px', borderRadius: '8px', cursor: 'pointer',
                      backgroundColor: copied ? V('--th-card') : V('--th-bg'),
                      border: `1px solid ${copied ? 'var(--th-primary)' : 'var(--th-border)'}`,
                    }}
                  >
                    {copied
                      ? <Check style={{ color: V('--th-primary'), width: '16px', height: '16px' }} />
                      : <Copy style={{ color: V('--th-primary'), width: '16px', height: '16px' }} />
                    }
                  </button>
                  <button
                    onClick={handleShare}
                    style={{
                      padding: '6px', borderRadius: '8px', cursor: 'pointer',
                      backgroundColor: shared ? V('--th-card') : V('--th-bg'),
                      border: `1px solid ${shared ? 'var(--th-primary)' : 'var(--th-border)'}`,
                    }}
                  >
                    {shared
                      ? <Check style={{ color: V('--th-primary'), width: '16px', height: '16px' }} />
                      : <Share2 style={{ color: V('--th-primary'), width: '16px', height: '16px' }} />
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* QR */}
            {roomInfo.inviteCode && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                <div ref={qrRef} style={{ borderRadius: '8px', overflow: 'hidden', width: 120, height: 120 }} />
              </div>
            )}
          </div>

          {/* Start Game button */}
          <button
            onClick={() => navigate(`/games/${roomId}`)}
            style={{
              width: '100%', padding: '16px', borderRadius: '14px', cursor: 'pointer',
              backgroundColor: V('--th-primary'), border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}
          >
            <Gamepad2 style={{ color: '#FFFFFF', width: '20px', height: '20px' }} />
            <span style={{ fontWeight: '700', fontSize: '15px', color: '#FFFFFF', letterSpacing: '0.05em' }}>
              {t('invite', 'startGame')}
            </span>
          </button>

          {/* Season Rankings */}
          {top3.length > 0 && (
            <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text') }}>Season Rankings</span>
                <button
                  onClick={() => navigate(`/ranking/${roomId}`)}
                  style={{ fontSize: '11px', color: V('--th-primary'), background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}
                >
                  VIEW ALL
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {top3.map((r, i) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const isFirst = i === 0;
                  return (
                    <div
                      key={r.memberId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: isFirst ? '12px' : '10px 12px', borderRadius: '12px',
                        backgroundColor: isFirst ? V('--th-bg') : V('--th-bg'),
                        border: `1px solid ${isFirst ? 'var(--th-primary)' : 'var(--th-border)'}`,
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{medals[i]}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '700', fontSize: '14px', color: V('--th-text') }}>{r.nickname}</p>
                        <p style={{ fontSize: '11px', color: V('--th-text-sub') }}>
                          {Math.round(r.rating)} POINTS · {r.winCount} WINS
                        </p>
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: isFirst ? V('--th-primary') : V('--th-text-sub'), fontFamily: 'monospace' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Room Members */}
          <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text') }}>Room Members</span>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', backgroundColor: V('--th-bg'), color: V('--th-text-sub'), border: `1px solid var(--th-border)` }}>
                {members.length}명
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {members.map((member) => {
                const isMe = member.memberId === userId;
                return (
                  <div key={member.memberId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      backgroundColor: V('--th-bg'),
                      border: `2px solid ${member.isHost ? 'var(--th-primary)' : 'var(--th-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', fontWeight: '700', color: V('--th-text'),
                    }}>
                      {member.nickname[0]}
                    </div>
                    <p style={{ fontSize: '11px', color: isMe ? V('--th-primary') : V('--th-text-sub'), maxWidth: '52px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.nickname}
                    </p>
                    {isHost && !isMe && !member.isHost && (
                      <button
                        onClick={() => handleKickMember(member)}
                        style={{ fontSize: '10px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {t('invite', 'kick')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invite;

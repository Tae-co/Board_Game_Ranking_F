import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, ArrowLeft, Check, Share2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';

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

  const { data: roomInfo = { name: '', inviteCode: '' } } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}`);
      return {
        name: res.data.roomName || res.data.name,
        inviteCode: res.data.inviteCode,
      };
    },
    staleTime: 1000 * 60 * 10,
    initialData: () => {
      const cachedRooms = queryClient.getQueryData(['rooms', String(userId)]);
      const found = cachedRooms?.find(r => String(r.roomId) === String(roomId));
      if (found) return { name: found.roomName, inviteCode: found.inviteCode };
      return undefined;
    },
  });

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
        width: 160,
        height: 160,
        colorDark: '#2C1F0E',
        colorLight: '#FFFFFF',
      });
    };

    if (window.QRCode) {
      loadQR();
    } else {
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
        await navigator.share({
          title: roomInfo.name,
          text: `${roomInfo.name} ${t('invite', 'shareText')}`,
          url: shareUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // 사용자가 취소한 경우 무시
      }
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
    } catch {
      alert(t('invite', 'leaveFailed'));
    }
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm(t('invite', 'deleteConfirm'))) return;
    try {
      await api.delete(`/rooms/${roomId}`);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      navigate('/lobby');
    } catch {
      alert(t('invite', 'deleteFailed'));
    }
  };

  const handleKickMember = async (member) => {
    if (!window.confirm(`${member.nickname}${t('invite', 'kickConfirm')}`)) return;
    try {
      await api.delete(`/rooms/${roomId}/members/${member.memberId}`);
      refetchMembers();
    } catch {
      alert(t('invite', 'kickFailed'));
    }
  };

  return (
    <div className="min-h-screen px-6 py-8" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: 'var(--th-bg)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/lobby')}
            className="mr-3 p-2 rounded-lg transition-colors"
            style={{ color: 'var(--th-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-card)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl" style={{ color: 'var(--th-text)' }}>{roomInfo.name}</h1>
        </div>
        {isHost ? (
          <button
            onClick={handleDeleteRoom}
            className="text-sm font-bold transition-colors"
            style={{ color: '#dc2626' }}
          >
            {t('invite', 'deleteRoom')}
          </button>
        ) : (
          <button
            onClick={handleLeaveRoom}
            className="text-sm font-bold transition-colors"
            style={{ color: 'var(--th-text-sub)' }}
          >
            {t('invite', 'leaveRoom')}
          </button>
        )}
      </div>

      {/* Invite Code Card with QR */}
      <div className="rounded-2xl p-6 mb-6 border shadow-sm text-center" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
        <p className="text-base font-bold mb-4" style={{ color: 'var(--th-text)' }}>{roomInfo.name}</p>
        <div className="flex justify-center mb-3">
          {!roomInfo.inviteCode ? (
            <div
              className="w-40 h-40 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--th-bg)' }}
            >
              <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--th-border)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <div ref={qrRef} className="rounded-xl overflow-hidden" style={{ width: 160, height: 160 }} />
          )}
        </div>
        <div className="text-lg tracking-widest mb-4 font-mono" style={{ color: 'var(--th-primary)' }}>
          {roomInfo.inviteCode}
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-5 py-2 rounded-full transition-colors"
            style={{
              backgroundColor: copied ? 'var(--th-card)' : 'var(--th-primary)',
              color: copied ? 'var(--th-primary)' : '#FFFFFF',
              border: copied ? '1px solid var(--th-primary)' : 'none',
            }}
          >
            {copied ? (
              <><Check className="w-4 h-4" />{t('invite', 'copied')}</>
            ) : (
              <><Copy className="w-4 h-4" />{t('invite', 'Code')}</>
            )}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2 rounded-full transition-colors"
            style={{
              backgroundColor: shared ? 'var(--th-card)' : 'var(--th-primary)',
              color: shared ? 'var(--th-primary)' : '#FFFFFF',
              border: shared ? '1px solid var(--th-primary)' : 'none',
            }}
          >
            {shared ? (
              <><Check className="w-4 h-4" />{t('invite', 'shared')}</>
            ) : (
              <><Share2 className="w-4 h-4" />{t('invite', 'Link')}</>
            )}
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="rounded-2xl p-5 mb-6 border shadow-sm" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
        <h2 className="text-lg mb-4" style={{ color: 'var(--th-text)' }}>{t('invite', 'members')} ({members.length})</h2>
        <div className="space-y-3">
          {members.map((member) => {
            const isMe = member.memberId === userId;
            return (
              <div key={member.memberId} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
                >
                  {member.nickname[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p style={{ color: 'var(--th-text)' }}>{member.nickname}</p>
                    {isMe && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--th-bg)', color: 'var(--th-text-sub)', border: '1px solid var(--th-border)' }}>{t('invite', 'me')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.isHost && (
                    <span className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}>
                      {t('invite', 'host')}
                    </span>
                  )}
                  {isHost && !isMe && !member.isHost && (
                    <button
                      onClick={() => handleKickMember(member)}
                      className="text-xs font-bold transition-colors"
                      style={{ color: '#dc2626' }}
                    >
                      {t('invite', 'kick')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => navigate(`/games/${roomId}`)}
          className="w-full py-2 rounded-full text-sm font-bold transition-opacity"
          style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {t('invite', 'startGame')}
        </button>
      </div>
    </div>
  );
};

export default Invite;

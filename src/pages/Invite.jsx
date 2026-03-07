import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, ArrowLeft, Check } from 'lucide-react';
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

  const { data: roomInfo = { name: '', inviteCode: '' } } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}`);
      return {
        name: res.data.roomName || res.data.name,
        inviteCode: res.data.inviteCode,
      };
    },
  });

  const { data: members = [], refetch: refetchMembers } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/members`);
      return res.data || [];
    },
  });

  const isHost = members.find(m => m.memberId === userId)?.isHost ?? false;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomInfo.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="min-h-screen px-6 py-8" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: '#FFF8F0' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/lobby')}
            className="mr-3 p-2 rounded-lg transition-colors"
            style={{ color: '#D4853A' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl" style={{ color: '#2C1F0E' }}>{roomInfo.name}</h1>
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
            style={{ color: '#8B7355' }}
          >
            {t('invite', 'leaveRoom')}
          </button>
        )}
      </div>

      {/* Invite Code Card */}
      <div className="rounded-2xl p-6 mb-6 border shadow-sm text-center" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>
        <p className="text-sm mb-3" style={{ color: '#8B7355' }}>{t('invite', 'inviteCode')}</p>
        <div className="text-4xl tracking-widest mb-4 font-mono" style={{ color: '#D4853A' }}>
          {roomInfo.inviteCode}
        </div>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-2 mx-auto px-6 py-2 rounded-full transition-colors"
          style={{
            backgroundColor: copied ? '#FFFFFF' : '#D4853A',
            color: copied ? '#D4853A' : '#FFFFFF',
            border: copied ? '1px solid #D4853A' : 'none',
          }}
        >
          {copied ? (
            <><Check className="w-4 h-4" />{t('invite', 'copied')}</>
          ) : (
            <><Copy className="w-4 h-4" />{t('invite', 'copyCode')}</>
          )}
        </button>
      </div>

      {/* Members List */}
      <div className="rounded-2xl p-5 mb-6 border shadow-sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>
        <h2 className="text-lg mb-4" style={{ color: '#2C1F0E' }}>{t('invite', 'members')} ({members.length})</h2>
        <div className="space-y-3">
          {members.map((member) => {
            const isMe = member.memberId === userId;
            return (
              <div key={member.memberId} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
                >
                  {member.nickname[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p style={{ color: '#2C1F0E' }}>{member.nickname}</p>
                    {isMe && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#FFF8F0', color: '#8B7355', border: '1px solid #E5D5C0' }}>{t('invite', 'me')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.isHost && (
                    <span className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}>
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
          className="w-full py-4 rounded-full transition-opacity"
          style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {t('invite', 'startGame')}
        </button>
        <button
          onClick={() => navigate(`/ranking/${roomId}`)}
          className="w-full py-4 rounded-full border transition-colors"
          style={{ backgroundColor: '#FFFFFF', color: '#D4853A', borderColor: '#D4853A' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#D4853A'; e.currentTarget.style.color = '#FFFFFF'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = '#D4853A'; }}
        >
          {t('invite', 'viewRanking')}
        </button>
      </div>
    </div>
  );
};

export default Invite;

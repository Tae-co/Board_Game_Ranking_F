import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, X } from 'lucide-react';
import StorageImage from '../components/StorageImage';
import NavAvatar from '../components/NavAvatar';
import api from '../api/axios';
import { V } from '../utils/cssUtils';
const COLORS = ['#6B5CE7','#F5A623','#22c55e','#3B82F6','#EF4444','#EC4899','#14B8A6','#F97316'];
const PER_PAGE = 10;

const CommunityMemberManage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('userId');
  const [page, setPage] = useState(0);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const selectedCommunity = (() => {
    try { return JSON.parse(localStorage.getItem('selectedCommunity')); } catch { return null; }
  })();
  const communityId = selectedCommunity?.communityId ?? null;

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: async () => {
      const res = await api.get(`/communities/${communityId}/members`);
      return res.data || [];
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 5,
  });

  const handleKick = async (member) => {
    if (!window.confirm(`${member.nickname}님을 커뮤니티에서 내보내시겠습니까?`)) return;
    try {
      await api.delete(`/communities/${communityId}/members/${member.memberId}`);
      queryClient.invalidateQueries({ queryKey: ['communityMembers', communityId] });
      setPage(0);
    } catch {
      alert('멤버 내보내기에 실패했습니다.');
    }
  };

  const totalPages = Math.ceil(members.length / PER_PAGE);
  const pagedMembers = members.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: 48 }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)`,
      }}>
        <div style={{
          maxWidth: 390, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              <ArrowLeft size={22} color="var(--th-primary)" />
            </button>
            <span style={{ fontSize: '18px', fontWeight: '700', color: V('--th-primary') }}>
              멤버 관리
            </span>
          </div>
          <NavAvatar size={36} fontSize={14} />
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px' }}>
        {isLoading ? (
          <p style={{ fontSize: '14px', color: V('--th-text-sub'), textAlign: 'center', padding: '40px 0' }}>로딩 중...</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
              <Users size={16} color="var(--th-text-sub)" />
              <span style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text-sub') }}>
                {members.length}명
              </span>
            </div>

            <div style={{
              backgroundColor: V('--th-card'), borderRadius: '16px',
              border: `1px solid var(--th-border)`, overflow: 'hidden',
            }}>
              {pagedMembers.map((member, idx) => {
                const color = COLORS[member.memberId % COLORS.length];
                const isMe = String(member.memberId) === String(userId);
                const isLast = idx === pagedMembers.length - 1;
                return (
                  <div
                    key={member.memberId}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px 16px',
                      borderBottom: isLast ? 'none' : `1px solid var(--th-border)`,
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', fontWeight: '700', color: '#fff',
                      overflow: 'hidden',
                    }}>
                      {member.profileImage
                        ? <StorageImage src={member.profileImage} alt={member.nickname} loading="lazy" decoding="async" transform={{ width: 88, height: 88, quality: 70 }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : member.nickname[0].toUpperCase()
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '15px', fontWeight: isMe ? '700' : '600',
                        color: isMe ? 'var(--th-primary)' : V('--th-text'),
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {member.nickname}
                      </div>
                      {isMe && (
                        <div style={{ fontSize: '11px', color: V('--th-text-sub'), marginTop: '2px' }}>나</div>
                      )}
                    </div>
                    {!isMe && (
                      <button
                        onClick={() => handleKick(member)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '6px', borderRadius: '8px', flexShrink: 0,
                          color: '#ef4444', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      fontSize: '14px', fontWeight: '700',
                      backgroundColor: page === i ? 'var(--th-primary)' : V('--th-card'),
                      color: page === i ? '#fff' : V('--th-text-sub'),
                      border: `1px solid ${page === i ? 'var(--th-primary)' : 'var(--th-border)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommunityMemberManage;

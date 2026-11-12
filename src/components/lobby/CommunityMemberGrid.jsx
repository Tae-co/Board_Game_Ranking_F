import { useState } from 'react';
import { Users, Settings } from 'lucide-react';
import { V } from '../../utils/cssUtils';
import { useSwipePaging } from '../../hooks/useSwipePaging';
import StorageImage from '../StorageImage';
import PageNumbers from './PageNumbers';

const MEMBERS_PER_PAGE = 15; // 5열 × 3행
const AVATAR_COLORS = ['#6B5CE7','#F5A623','#22c55e','#3B82F6','#EF4444','#EC4899','#14B8A6','#F97316'];

/** 커뮤니티 로비 아래 멤버 목록 (15명씩 페이지). 어드민에게는 멤버 관리 톱니바퀴가 보인다. */
const CommunityMemberGrid = ({ members, userId, isAdmin, onManage, t }) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(members.length / MEMBERS_PER_PAGE);
  const swipe = useSwipePaging(page, totalPages, setPage);
  const pagedMembers = members.slice(page * MEMBERS_PER_PAGE, (page + 1) * MEMBERS_PER_PAGE);

  return (
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
            {members.length}
          </span>
          {isAdmin && (
            <button
              onClick={onManage}
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

      {members.length === 0 ? (
        <p style={{ fontSize: '14px', color: V('--th-text-sub'), textAlign: 'center', padding: '20px 0' }}>
          {t('community', 'noCommunityMembers')}
        </p>
      ) : (
        <>
          <div {...swipe} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '10px 6px',
          }}>
            {pagedMembers.map((member) => {
              const color = AVATAR_COLORS[member.memberId % AVATAR_COLORS.length];
              const isMe = String(member.memberId) === String(userId);
              return (
                <div key={member.memberId} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                  minWidth: 0,
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
          <PageNumbers page={page} totalPages={totalPages} onChange={setPage} marginTop="14px" />
        </>
      )}
    </div>
  );
};

export default CommunityMemberGrid;

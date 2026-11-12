import { useState } from 'react';
import { Search, Check } from 'lucide-react';
import { V } from '../../utils/cssUtils';
import { useSwipePaging } from '../../hooks/useSwipePaging';
import RoleBadge from '../shared/RoleBadge';

const ADMIN_PER_PAGE = 10;

const Avatar = ({ nickname, selected }) => (
  <div style={{
    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
    backgroundColor: selected ? 'var(--th-primary)' : 'var(--th-bg)',
    border: `2px solid ${selected ? 'var(--th-primary)' : 'var(--th-border)'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '700',
    color: selected ? '#fff' : V('--th-text-sub'),
    transition: 'all 0.15s',
  }}>
    {nickname[0].toUpperCase()}
  </div>
);

/**
 * 커뮤니티 수정 화면의 어드민 고르기 카드 (검색 + 10명씩 페이지).
 * ownerInfo가 있으면(내가 소유자가 아닐 때) 해제할 수 없는 소유자를 맨 위에 체크된 채 고정한다.
 */
const AdminPicker = ({ members, ownerInfo, ownerId, userId, selectedIds, maxSelected, totalAdminCount, onToggle, t }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  // 검색어 기준 클라이언트 필터
  const filteredMembers = searchQuery.trim()
    ? members.filter((m) => m.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
    : members;
  const totalPages = Math.ceil(filteredMembers.length / ADMIN_PER_PAGE);
  const pagedMembers = filteredMembers.slice(page * ADMIN_PER_PAGE, (page + 1) * ADMIN_PER_PAGE);
  const swipe = useSwipePaging(page, totalPages, setPage);

  const pageButtonStyle = (disabled) => ({
    padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
    border: `1px solid var(--th-border)`, backgroundColor: V('--th-bg'),
    color: disabled ? V('--th-text-sub') : V('--th-text'),
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={{
      backgroundColor: V('--th-card'), borderRadius: '20px',
      border: `1px solid var(--th-border)`, padding: '20px',
      marginBottom: '20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text') }}>
          {t('community', 'adminsLabel')}
        </span>
        <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
          {totalAdminCount}{t('community', 'adminsSelected')}
        </span>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 14px', borderRadius: '12px',
        border: `1px solid var(--th-border)`,
        backgroundColor: V('--th-bg'), marginBottom: '12px',
      }}>
        <Search size={15} color={V('--th-text-sub')} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          placeholder={t('community', 'searchByNickname')}
          style={{
            flex: 1, border: 'none', outline: 'none',
            backgroundColor: 'transparent', color: V('--th-text'), fontSize: '14px',
          }}
        />
      </div>

      {/* 소유자 — 공동 어드민은 해제할 수 없어 체크된 채 고정 */}
      {ownerInfo && (
        <div style={{
          padding: '10px 12px', marginBottom: '2px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '12px',
          backgroundColor: 'rgba(107,92,231,0.08)',
        }}>
          <Avatar nickname={ownerInfo.nickname} selected />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '14px', fontWeight: '500', color: 'var(--th-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {ownerInfo.nickname}
            </span>
            <RoleBadge owner />
          </span>
          <Check size={16} color="var(--th-primary)" strokeWidth={2.5} />
        </div>
      )}

      {/* Member list */}
      <div {...swipe} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {filteredMembers.length === 0 ? (
          <p style={{ fontSize: '13px', color: V('--th-text-sub'), textAlign: 'center', padding: '20px 0', margin: 0 }}>
            {t('community', 'searchNoResult')}
          </p>
        ) : (
          pagedMembers.map((m) => {
            const isSelected = selectedIds.has(m.memberId);
            const isDisabled = !isSelected && selectedIds.size >= maxSelected;
            return (
              <button
                key={m.memberId}
                onClick={() => !isDisabled && onToggle(m.memberId)}
                style={{
                  width: '100%', padding: '10px 12px', border: 'none',
                  borderRadius: '10px', cursor: isDisabled ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  backgroundColor: isSelected ? 'rgba(107,92,231,0.08)' : 'transparent',
                  transition: 'background-color 0.15s',
                  opacity: isDisabled ? 0.4 : 1,
                }}
              >
                <Avatar nickname={m.nickname} selected={isSelected} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '14px', fontWeight: '500', textAlign: 'left',
                    color: isSelected ? 'var(--th-primary)' : V('--th-text'),
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {m.nickname}
                  </span>
                  {m.memberId === userId && (
                    <span style={{ flexShrink: 0, fontSize: '11px', color: V('--th-text-sub') }}>{t('invite', 'me')}</span>
                  )}
                  {m.memberId === ownerId && <RoleBadge owner />}
                </span>
                {isSelected && (
                  <Check size={16} color="var(--th-primary)" strokeWidth={2.5} />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={pageButtonStyle(page === 0)}
          >
            ‹
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: V('--th-text-sub') }}>{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={pageButtonStyle(page >= totalPages - 1)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPicker;

import { useRef } from 'react';
import { Pencil, Check } from 'lucide-react';
import InitialAvatar from '../shared/InitialAvatar';
import { V } from '../../utils/cssUtils';

const RankingTable = ({ pagedRankings, page, setPage, totalPages, myUserId, isHost, onEditRating, PAGE_SIZE, selectedPlayers, onToggle }) => {
  const touchStartX = useRef(null);
  return (
  <>
    <div style={{
      display: 'flex', padding: '6px 12px', marginBottom: 4, marginTop: 4,
      backgroundColor: V('--th-card'), borderRadius: 8,
      border: '1px solid var(--th-border)',
    }}>
      <div style={{ width: 32, fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase' }}>RANK</div>
      <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', paddingLeft: 36 }}>PLAYER</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase' }}>RATING</div>
    </div>

    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = touchStartX.current - e.changedTouches[0].clientX;
        touchStartX.current = null;
        if (delta > 50 && page < totalPages - 1) setPage(p => p + 1);
        else if (delta < -50 && page > 0) setPage(p => p - 1);
      }}
    >
      {pagedRankings.map((rank, idx) => {
        const rankNum = page * PAGE_SIZE + idx + 1;
        const isMe = rank.memberId === myUserId;
        const isUnranked = rank.hasRank === false;
        const isSelected = selectedPlayers?.has(rank.memberId);
        const selectable = !!onToggle;
        return (
          <div
            key={rank.memberId}
            onClick={selectable ? () => onToggle(rank.memberId) : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: isMe ? '10px 12px 10px 10px' : '10px 12px',
              borderRadius: 12,
              cursor: selectable ? 'pointer' : 'default',
              backgroundColor: isSelected
                ? 'color-mix(in srgb, var(--th-primary) 12%, transparent)'
                : isMe ? 'color-mix(in srgb, var(--th-primary) 8%, transparent)' : V('--th-card'),
              border: `1px solid ${isSelected || isMe ? 'var(--th-primary)' : 'var(--th-border)'}`,
              borderLeft: isSelected || isMe ? '4px solid var(--th-primary)' : `1px solid var(--th-border)`,
              boxShadow: isMe ? '0 2px 12px color-mix(in srgb, var(--th-primary) 20%, transparent)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 24, fontSize: 12, fontWeight: 700, color: isMe || isSelected ? 'var(--th-primary)' : V('--th-text-sub'), textAlign: 'center' }}>
              {isUnranked ? '—' : rankNum}
            </div>
            <InitialAvatar nickname={rank.nickname} profileImage={rank.profileImage} size={28} fontSize={11} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: isMe || isSelected ? 700 : 500, color: isMe || isSelected ? 'var(--th-primary)' : V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {rank.nickname}
              </div>
              {isMe && <div style={{ fontSize: 10, color: 'var(--th-primary)', fontWeight: 700, letterSpacing: '0.05em' }}>YOU</div>}
              {isUnranked && <div style={{ fontSize: 10, color: V('--th-text-sub'), fontWeight: 600, letterSpacing: '0.05em' }}>UNRANKED</div>}
            </div>
            {isHost && !isUnranked && (
              <button
                onClick={(e) => { e.stopPropagation(); onEditRating(rank); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
              >
                <Pencil style={{ width: 13, height: 13, color: V('--th-text-sub') }} />
              </button>
            )}
            {isSelected ? (
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                backgroundColor: 'var(--th-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check style={{ color: '#fff', width: 13, height: 13 }} />
              </div>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--th-primary)', flexShrink: 0 }}>
                {isUnranked ? '—' : Math.round(rank.rating).toLocaleString()}
              </span>
            )}
          </div>
        );
      })}
    </div>

    {totalPages > 1 && (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          style={{ padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1px solid var(--th-border)`, backgroundColor: V('--th-card'), color: page === 0 ? V('--th-text-sub') : V('--th-text'), cursor: page === 0 ? 'not-allowed' : 'pointer' }}
        >
          ‹
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, color: V('--th-text-sub') }}>{page + 1} / {totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          style={{ padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1px solid var(--th-border)`, backgroundColor: V('--th-card'), color: page >= totalPages - 1 ? V('--th-text-sub') : V('--th-text'), cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
        >
          ›
        </button>
      </div>
    )}
  </>
  );
};

export default RankingTable;

import { useRef } from 'react';
import { Pencil, Check, Crown } from 'lucide-react';
import InitialAvatar from '../shared/InitialAvatar';
import { V } from '../../utils/cssUtils';
import { useLanguage } from '../../i18n/LanguageContext';

// championIds = 직전 시즌 1위들(동점 가능). 금관은 1등만 붙인다 — 2·3등까지 달면
// 테이블이 배지 밭이 되어 정작 현재 순위가 안 읽힌다 (기획 §4).
const MAX_PLACE_COLUMNS = 4;

const RankingTable = ({ pagedRankings, page, setPage, totalPages, myUserId, isHost, onEditRating, PAGE_SIZE, selectedPlayers, onToggle, highlightMemberId, nudge, championIds, scoreLabel = 'RATING' }) => {
  const { t } = useLanguage();
  const touchStartX = useRef(null);
  // 순위 분포 칸 수를 표 전체에서 맞춘다. 4인전 방이면 모든 행이 1~4등을 같은 자리에 보여준다
  const maxPlace = Math.max(0, ...pagedRankings.map(r => r.placementCounts?.length ?? 0));
  // 5인 이상 게임은 마지막 칸을 'N등 이하'로 합친다. 숨기면 점수를 가장 많이 깎은 하위권이 사라진다
  const placeColumns = Math.min(maxPlace, MAX_PLACE_COLUMNS);
  const mergeTail = maxPlace > MAX_PLACE_COLUMNS;
  return (
  <>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', marginBottom: 4, marginTop: 4,
      backgroundColor: V('--th-card'), borderRadius: 8,
      border: '1px solid var(--th-border)',
    }}>
      {!!onToggle && <div style={{ width: 22, flexShrink: 0 }} />}
      <div style={{ width: 24, fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase', flexShrink: 0 }}>{t('ranking', 'colRank')}</div>
      <div style={{ width: 28, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase' }}>{t('ranking', 'colPlayer')}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: V('--th-text-sub'), textTransform: 'uppercase' }}>{scoreLabel}</div>
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
        // 서버가 준 순위를 그대로 쓴다. 지난 시즌 스냅샷은 동점에 같은 순위를 주므로
        // (1, 2, 2, 4) 인덱스로 만들면 틀린다. 현재 랭킹은 서버 순위와 인덱스가 같다.
        const rankNum = rank.rank ?? (page * PAGE_SIZE + idx + 1);
        const isMe = rank.memberId === myUserId;
        const isUnranked = rank.hasRank === false;
        const isSelected = selectedPlayers?.has(rank.memberId);
        const selectable = !!onToggle;
        const isHighlighted = highlightMemberId === rank.memberId;
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
              border: `1px solid ${isHighlighted ? '#f59e0b' : isSelected || isMe ? 'var(--th-primary)' : 'var(--th-border)'}`,
              borderLeft: isHighlighted ? '4px solid #f59e0b' : isSelected || isMe ? '4px solid var(--th-primary)' : `1px solid var(--th-border)`,
              boxShadow: isHighlighted ? '0 2px 12px rgba(245,158,11,0.3)' : isMe ? '0 2px 12px color-mix(in srgb, var(--th-primary) 20%, transparent)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {selectable && (
              isSelected ? (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: 'var(--th-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: nudge === 'deselect' ? 'select-pulse 0.5s ease-in-out 2' : undefined,
                }}>
                  <Check style={{ color: '#fff', width: 13, height: 13 }} />
                </div>
              ) : (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid var(--th-primary)`,
                  backgroundColor: 'color-mix(in srgb, var(--th-primary) 10%, transparent)',
                  animation: nudge === 'select' ? 'select-pulse 0.5s ease-in-out 2' : undefined,
                }} />
              )
            )}
            <div style={{ width: 24, fontSize: 12, fontWeight: 700, color: isMe || isSelected ? 'var(--th-primary)' : V('--th-text-sub'), textAlign: 'center' }}>
              {isUnranked ? '—' : rankNum}
            </div>
            <InitialAvatar nickname={rank.nickname} profileImage={rank.profileImage} size={28} fontSize={11} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: isMe || isSelected ? 700 : 500, color: isMe || isSelected ? 'var(--th-primary)' : V('--th-text'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {championIds?.has(rank.memberId) && <Crown size={13} color="#F59E0B" fill="#FFD700" strokeWidth={2.2} style={{ marginRight: 3, verticalAlign: '-2px' }} />}
                {rank.nickname}
              </div>
              {isUnranked ? (
                <div style={{ fontSize: 10, color: V('--th-text-sub'), fontWeight: 600, letterSpacing: '0.05em' }}>{t('ranking', 'unranked')}</div>
              ) : (rank.winCount > 0 || rank.loseCount > 0) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  {rank.placementCounts ? (
                    // 승/패만 보면 2등 15번과 꼴등 15번이 같은 15패로 보여 점수가 납득되지 않는다
                    Array.from({ length: placeColumns }, (_, i) => (
                      <span key={i} style={{ display: 'contents' }}>
                        {i > 0 && <span style={{ fontSize: 9, color: V('--th-text-sub') }}>·</span>}
                        <span style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? '#16a34a' : V('--th-text-sub') }}>
                          {mergeTail && i === placeColumns - 1
                            ? t('ranking', 'placeShortOrLower').replace('{p}', t('ranking', 'placeLabels')[i])
                                .replace('{n}', rank.placementCounts.slice(i).reduce((a, b) => a + b, 0))
                            : t('ranking', 'placeShort').replace('{p}', t('ranking', 'placeLabels')[i]).replace('{n}', rank.placementCounts[i] ?? 0)}
                        </span>
                      </span>
                    ))
                  ) : (
                    <>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a' }}>{t('ranking', 'winShort').replace('{n}', rank.winCount)}</span>
                      <span style={{ fontSize: 9, color: V('--th-text-sub') }}>·</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626' }}>{t('ranking', 'lossShort').replace('{n}', rank.loseCount)}</span>
                    </>
                  )}
                </div>
              ) : null}
            </div>
            {isHost && !isUnranked && (
              <button
                onClick={(e) => { e.stopPropagation(); onEditRating(rank); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
              >
                <Pencil style={{ width: 13, height: 13, color: V('--th-text-sub') }} />
              </button>
            )}
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--th-primary)', flexShrink: 0 }}>
              {isUnranked ? '—' : Math.round(rank.rating).toLocaleString()}
            </span>
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

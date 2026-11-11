import { useMemo } from 'react';
import { V } from '../../utils/cssUtils';
import { useSwipePaging } from '../../hooks/useSwipePaging';
import MatchCard from '../ranking/MatchCard';

const MATCH_PAGE_SIZE = 5;
const MAX_MATCH_PAGES = 10;

/** 게임방 로비의 매치기록 탭 (진행 중 시즌 경기, 5개씩 페이지) */
const MatchHistoryTab = ({
  matches, page, setPage, myUserId, communityTimezone, isHost,
  onView, onEdit, onDelete, chip, t,
}) => {
  // 매치기록은 최신 10페이지까지만 보여준다. 기록이 쌓일수록 페이지가 무한정 늘어나는 걸 막는다.
  // 서버 데이터는 그대로 둔다 — 실제로 지우면 MatchService가 레이팅을 재계산해서 점수가 바뀐다.
  const visibleMatches = useMemo(
    () => matches.slice(0, MATCH_PAGE_SIZE * MAX_MATCH_PAGES),
    [matches],
  );
  const totalPages = Math.ceil(visibleMatches.length / MATCH_PAGE_SIZE);

  // 기록이 줄어 현재 페이지가 범위를 벗어나면 마지막 페이지를 보여준다
  const pagedMatches = useMemo(() => {
    const safePage = Math.min(page, Math.max(0, totalPages - 1));
    return visibleMatches.slice(safePage * MATCH_PAGE_SIZE, (safePage + 1) * MATCH_PAGE_SIZE);
  }, [visibleMatches, page, totalPages]);

  const swipe = useSwipePaging(page, totalPages, setPage);

  const pageButtonStyle = (disabled) => ({
    padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700,
    border: `1px solid var(--th-border)`, backgroundColor: V('--th-card'),
    color: disabled ? V('--th-text-sub') : V('--th-text'),
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <>
      <div style={{ fontSize: 11, fontWeight: 800, color: V('--th-text-sub'), textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{t('invite', 'recentSessions')}</div>
      {matches.length === 0 ? (
        <div style={{ borderRadius: 16, padding: 40, border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
          <p style={{ color: V('--th-text') }}>{t('ranking', 'noMatches')}</p>
          <p style={{ fontSize: 13, marginTop: 8, color: V('--th-text-sub') }}>{t('ranking', 'noMatchesDesc')}</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} {...swipe}>
            {pagedMatches.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                myUserId={myUserId}
                communityTimezone={communityTimezone}
                isHost={isHost}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                chip={chip}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14 }}>
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
        </>
      )}
    </>
  );
};

export default MatchHistoryTab;

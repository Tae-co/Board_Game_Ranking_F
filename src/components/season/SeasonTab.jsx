import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRoomSeasons, getSeasonPodium, getRoomSeasonRankings } from '../../api/services/rooms';
import { getMemberSeasonHistory } from '../../api/services/members';
import { RankRowSkeleton } from '../Skeleton';
import RankingTable from '../ranking/RankingTable';
import SeasonHeader from './SeasonHeader';
import SeasonPodium from './SeasonPodium';
import SeasonTrend from './SeasonTrend';
import { V } from '../../utils/cssUtils';
import { fill, periodMonthLabel } from '../../utils/seasonUtils';

const PAGE_SIZE = 7;

/**
 * 방의 "시즌" 탭 (기획 §6). 네 덩이로 되어 있다.
 *   ① 현재 시즌 진행 상황 — 프론트 계산, 서버 요청 없음
 *   ② 지난 시즌 시상대
 *   ③ 지난 시즌 순위표 + 월 선택
 *   ④ 시즌별 내 점수 추이 (2시즌 이상일 때만)
 *
 * 마감된 시즌이 하나도 없으면 ①만 남기고 ②③④를 숨긴다 — 첫 시즌에는 그게 정상 화면이다.
 */
const SeasonTab = ({ roomId, userId, region, myRankPosition, myScore, onPastSeasonViewed, t, lang }) => {
  const [pickedSeason, setPickedSeason] = useState(null);
  const [page, setPage] = useState(0);

  const { data: seasons = [], isLoading: seasonsLoading } = useQuery({
    queryKey: ['roomSeasons', roomId],
    queryFn: () => getRoomSeasons(roomId),
    staleTime: 1000 * 60 * 10,
  });

  // 고르지 않았으면 가장 최근에 끝난 시즌. 이펙트로 state를 채우지 않고 파생시킨다 —
  // 목록이 늦게 도착해도 한 번 더 렌더되지 않는다.
  const selectedSeason = pickedSeason ?? seasons[0]?.seasonKey ?? null;

  const { data: pastRanking = [], isLoading: rankingLoading } = useQuery({
    queryKey: ['seasonRanking', roomId, selectedSeason],
    queryFn: () => getRoomSeasonRankings(roomId, selectedSeason),
    enabled: !!selectedSeason,
    staleTime: 1000 * 60 * 10,
  });

  const { data: podium = [] } = useQuery({
    queryKey: ['seasonPodium', roomId, selectedSeason],
    queryFn: () => getSeasonPodium(roomId, selectedSeason),
    enabled: !!selectedSeason,
    staleTime: 1000 * 60 * 10,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['seasonHistory', userId, roomId],
    queryFn: () => getMemberSeasonHistory(userId, roomId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });

  // 지난 시즌을 실제로 조회했을 때만 계측한다 (탭 진입이 아니라 시즌을 고른 시점).
  useEffect(() => {
    if (selectedSeason) onPastSeasonViewed?.(selectedSeason);
  }, [selectedSeason, onPastSeasonViewed]);

  const pagedRanking = useMemo(
    () => pastRanking.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [pastRanking, page],
  );
  const totalPages = Math.ceil(pastRanking.length / PAGE_SIZE);

  const selected = seasons.find((s) => s.seasonKey === selectedSeason);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ① 현재 시즌 */}
      <SeasonHeader
        region={region}
        myRankPosition={myRankPosition}
        myScore={myScore}
        t={t}
        lang={lang}
      />

      {seasonsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map((i) => <RankRowSkeleton key={i} />)}
        </div>
      ) : seasons.length === 0 ? (
        <div style={{ borderRadius: 14, padding: '28px 20px', border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🌱</div>
          <p style={{ fontSize: 14, fontWeight: 700, color: V('--th-text'), margin: '0 0 6px' }}>
            {t('season', 'noPastSeason')}
          </p>
          <p style={{ fontSize: 12, color: V('--th-text-sub'), margin: 0, lineHeight: 1.5 }}>
            {t('season', 'noPastSeasonDesc')}
          </p>
        </div>
      ) : (
        <>
          {/* ② 시상대 — 자격 미달이면 서버가 빈 배열을 준다 */}
          {podium.length > 0 ? (
            <SeasonPodium entries={podium} myUserId={userId} t={t} />
          ) : (
            <div style={{
              borderRadius: 14, padding: '12px 14px', backgroundColor: V('--th-card'),
              border: `1px solid var(--th-border)`, fontSize: 12, fontWeight: 600,
              color: V('--th-text-sub'), textAlign: 'center',
            }}>
              {t('season', 'awardNeedsPlayers')}
            </div>
          )}

          {/* ③ 지난 시즌 순위표 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: V('--th-text') }}>
                {t('season', 'pastSeason')}
              </span>
              {selected && (
                <span style={{ fontSize: 11, fontWeight: 600, color: V('--th-text-sub') }}>
                  {fill(t('season', selected.matchCount === 1 ? 'matchesUnitOne' : 'matchesUnit'), { count: selected.matchCount })}
                  {' · '}
                  {fill(t('season', selected.playerCount === 1 ? 'playersUnitOne' : 'playersUnit'), { count: selected.playerCount })}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 8 }}>
              {seasons.map((season) => {
                const active = season.seasonKey === selectedSeason;
                return (
                  <button
                    key={season.seasonKey}
                    onClick={() => { setPickedSeason(season.seasonKey); setPage(0); }}
                    style={{
                      flexShrink: 0, padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                      fontSize: 12, fontWeight: 700,
                      backgroundColor: active ? 'var(--th-primary)' : V('--th-card'),
                      color: active ? '#fff' : V('--th-text-sub'),
                      border: `1px solid ${active ? 'var(--th-primary)' : 'var(--th-border)'}`,
                    }}
                  >
                    {periodMonthLabel(season.seasonKey, lang)}
                  </button>
                );
              })}
            </div>

            {rankingLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[0, 1, 2].map((i) => <RankRowSkeleton key={i} />)}
              </div>
            ) : pastRanking.length === 0 ? (
              <div style={{ borderRadius: 14, padding: '24px 20px', border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: V('--th-text-sub'), margin: 0 }}>{t('season', 'noSeasonMatches')}</p>
              </div>
            ) : (
              <RankingTable
                pagedRankings={pagedRanking}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                myUserId={userId}
                isHost={false}
                onEditRating={undefined}
                PAGE_SIZE={PAGE_SIZE}
                scoreLabel={t('season', 'seasonScore')}
              />
            )}
          </div>

          {/* ④ 점수 추이 — 시즌 1개짜리 그래프는 고장으로 보인다 */}
          {history.length >= 2 && <SeasonTrend history={history} lang={lang} t={t} />}
        </>
      )}
    </div>
  );
};

export default SeasonTab;

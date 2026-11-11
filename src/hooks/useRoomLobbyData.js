import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePresence } from './usePresence';
import { getRoom, getRoomMembers, getRoomRankings, getRoomMatches, getRoomSeasons, getSeasonPodium, getCurrentSeason } from '../api/services/rooms';
import { getGame } from '../api/services/games';
import { isInSeason } from '../utils/seasonUtils';

/** 게임방 로비(Invite) 화면이 쓰는 서버 데이터 묶음. */
export const useRoomLobbyData = (roomId, userId) => {
  const queryClient = useQueryClient();

  const { data: roomInfo = {} } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => getRoom(roomId),
    staleTime: 1000 * 60 * 10,
    initialData: () => {
      const cachedRooms = queryClient.getQueryData(['rooms', String(userId)]);
      const found = cachedRooms?.find(r => String(r.roomId) === String(roomId));
      if (found) return found;
      const communityCache = queryClient.getQueriesData({ queryKey: ['communityRooms'] });
      for (const [, rooms] of communityCache) {
        if (!Array.isArray(rooms)) continue;
        const hit = rooms.find(r => String(r.roomId) === String(roomId));
        if (hit) return hit;
      }
      return undefined;
    },
  });

  const { data: members = [], isLoading: membersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: () => getRoomMembers(roomId),
    staleTime: 1000 * 60 * 2,
  });

  // 접속 중인데 멤버 목록에 없는 사람이 보이면(방금 참가) 목록을 다시 받는다.
  const onlineIds = usePresence(userId, roomId);
  useEffect(() => {
    if (membersLoading || onlineIds.size === 0) return;
    const memberIdSet = new Set(members.map(m => m.memberId));
    if ([...onlineIds].some(id => !memberIdSet.has(id))) refetchMembers();
  }, [onlineIds, members, membersLoading, refetchMembers]);

  // 방의 게임을 id로 직접 가져온다. 커뮤니티 목록을 거치지 않으므로
  // 초대 링크로 들어온 비(非)커뮤니티 멤버도 커스텀 게임 정보를 볼 수 있다.
  const { data: gameInfo = null } = useQuery({
    queryKey: ['game', roomInfo.boardGameId],
    queryFn: () => getGame(roomInfo.boardGameId),
    enabled: !!roomInfo.boardGameId,
    staleTime: 1000 * 60 * 30,
  });

  const { data: rankings = [], isLoading: isRankingLoading } = useQuery({
    queryKey: ['rankings', roomId],
    queryFn: () => getRoomRankings(roomId),
    staleTime: 1000 * 60 * 3,
  });

  // 진행 중 시즌 (이름·기간). 종료 시각이 지났으면 서버가 넘긴 뒤의 시즌을 준다.
  const { data: currentSeason = null, isLoading: isSeasonLoading } = useQuery({
    queryKey: ['currentSeason', roomId],
    queryFn: () => getCurrentSeason(roomId),
    staleTime: 1000 * 60 * 5,
  });

  // 금관(직전 시즌 1위). 시즌 목록의 첫 항목이 곧 마지막으로 끝난 시즌이므로 날짜 계산이 필요 없고,
  // 다음 시즌이 끝나면 목록의 첫 항목이 바뀌어 금관이 저절로 옮겨간다 (기획 §4의 "다음 시즌 종료까지").
  const { data: closedSeasons = [] } = useQuery({
    queryKey: ['roomSeasons', roomId],
    queryFn: () => getRoomSeasons(roomId),
    staleTime: 1000 * 60 * 10,
  });
  const latestSeasonId = closedSeasons[0]?.seasonId;
  const { data: latestPodium = [] } = useQuery({
    queryKey: ['seasonPodium', roomId, latestSeasonId],
    queryFn: () => getSeasonPodium(roomId, latestSeasonId),
    enabled: !!latestSeasonId,
    staleTime: 1000 * 60 * 10,
  });
  // 리셋 직후 = 마감된 시즌이 있는데 이번 시즌 경기가 아직 0판. 한 판이라도 하면 저절로 사라진다.
  const justReset = closedSeasons.length > 0
    && rankings.length > 0
    && rankings.every(r => (r.playCount ?? 0) === 0);

  const championIds = useMemo(
    () => new Set(latestPodium.filter(e => e.rank === 1).map(e => e.memberId)),
    [latestPodium],
  );

  const { data: allMatchesRaw = [], isLoading: isMatchesLoading } = useQuery({
    queryKey: ['matches', roomId],
    queryFn: () => getRoomMatches(roomId),
    staleTime: 1000 * 60 * 1,
  });
  // 매치기록도 시즌과 함께 새로 시작한다. DB는 그대로 두고 진행 중 시즌 경기만 보여준다.
  // 지난 시즌 기록은 시즌 탭에서 본다.
  const allMatches = allMatchesRaw.filter(m =>
    (!roomInfo.boardGameId || m.boardGameId === roomInfo.boardGameId)
    && isInSeason(m.playedAt, currentSeason));

  return {
    roomInfo, members, membersLoading, gameInfo,
    rankings, isRankingLoading,
    currentSeason, isSeasonLoading, closedSeasons, latestSeasonId, justReset, championIds,
    allMatches, isMatchesLoading,
  };
};

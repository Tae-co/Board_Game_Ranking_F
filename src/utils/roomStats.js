// 방 로비(Invite)에서 랭킹·멤버·경기 목록으로 계산하는 값들.

// 랭킹 순서(점수 내림차순)를 유지하고, 아직 경기가 없는 멤버는 뒤에 hasRank: false로 붙인다.
export const mergeRankedMembers = (members, rankings) => {
  const memberMap = new Map(members.map(m => [m.memberId, m]));
  const rankedIds = new Set(rankings.map(r => r.memberId));
  const ranked = rankings
    .map((r, i) => ({ ...memberMap.get(r.memberId), ...r, rankPosition: i + 1 }))
    .filter(r => r.memberId != null);
  const unranked = members
    .filter(m => !rankedIds.has(m.memberId))
    .map(m => ({ ...m, hasRank: false }));
  return [...ranked, ...unranked];
};

// 가장 최근 경기부터 1등/1등 아님이 몇 판 이어졌는지. 경기가 없으면 null.
export const getMyStreak = (matches, userId) => {
  const myMatches = matches
    .filter(m => m.participants?.some(p => p.memberId === userId))
    .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
  if (myMatches.length === 0) return null;
  const first = myMatches[0].participants.find(p => p.memberId === userId);
  const isWin = first?.placement === 1;
  let count = 1;
  for (let i = 1; i < myMatches.length; i++) {
    const p = myMatches[i].participants.find(p => p.memberId === userId);
    if ((p?.placement === 1) === isWin) count++;
    else break;
  }
  return { count, isWin };
};

export const getWinRate = (rank) => {
  if (!rank || rank.winCount + rank.loseCount === 0) return 0;
  return Math.round(rank.winCount / (rank.winCount + rank.loseCount) * 100);
};

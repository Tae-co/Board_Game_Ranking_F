// 연습 모드의 가짜 서버. 연습 중에는 axios 요청이 실제 서버 대신 여기로 온다 (api/axios.js).
// 응답은 백엔드 DTO와 같은 모양이라 화면 코드는 연습인지 모른 채 그대로 그린다.
// 아무것도 저장하지 않는다 — 메모리에만 있고, 연습이 끝나면 reset()으로 비운다.

// 실제 id와 겹치지 않게 큰 수를 쓴다. 900000001 % 8 = 1 → 예시 친구 아바타 색이 캔버스 순서(주황·초록·파랑·빨강)와 같다
const PRACTICE_ID = 900000001;
// 예시 친구 4명 — 카탄(3~4명)에서 최소·최대 인원을 직접 겪게 모임을 5명으로 둔다
export const EXAMPLE_FRIEND_IDS = [0, 1, 2, 3].map(i => PRACTICE_ID + i);
export const PRACTICE_INVITE_CODE = 'AB12CD';

// 백엔드 RatingConstants·EloRatingCalculator와 같은 규칙 (캐주얼 규칙)
const INITIAL_RATING = 500;
const RATING_FLOOR = 500;
const ELO_SCALE = 3200;
const K_PLACEMENT = 300;
const K_REGULAR = 200;
const PLACEMENT_GAMES = 3;
const SECOND_PLACE_SHARE = 0.1;
const CASUAL_CEILING = 1300;
const LOSS_HALF_BELOW = 1000;

const winMultiplier = (rating) => {
  if (rating < 700) return 1.25;
  if (rating < LOSS_HALF_BELOW) return 1.15;
  if (rating < CASUAL_CEILING) return 1.05;
  return 1;
};

const lossMultiplier = (rating) => {
  if (rating < LOSS_HALF_BELOW) return 0.5;
  if (rating >= CASUAL_CEILING) return 1;
  return 0.5 + 0.5 * (rating - LOSS_HALF_BELOW) / (CASUAL_CEILING - LOSS_HALF_BELOW);
};

const expectedScore = (mine, theirs) => 1 / (1 + 10 ** ((theirs - mine) / ELO_SCALE));

/** 한 판의 점수 변화. players: [{ memberId, placement, rating, playCount }] → { memberId: 변화량 } */
export const calculateRatingChanges = (players) => {
  const opponents = players.length - 1;
  const lastPlacement = Math.max(...players.map(p => p.placement));
  const secondCount = players.filter(p => p.placement === 2).length;
  const lastCount = players.filter(p => p.placement === lastPlacement).length;
  const transfer = secondCount > 0 && lastPlacement > 2;
  const changes = {};
  for (const me of players) {
    if (opponents < 1) { changes[me.memberId] = 0; continue; }
    let surprise = 0;
    for (const other of players) {
      if (other === me) continue;
      const actual = me.placement < other.placement ? 1 : me.placement === other.placement ? 0.5 : 0;
      surprise += actual - expectedScore(me.rating, other.rating);
    }
    const k = me.playCount < PLACEMENT_GAMES ? K_PLACEMENT : K_REGULAR;
    let change = k * surprise / opponents;
    if (transfer && me.placement === 2) change += k * SECOND_PLACE_SHARE / secondCount;
    else if (transfer && me.placement === lastPlacement) change -= k * SECOND_PLACE_SHARE / lastCount;
    change *= change > 0 ? winMultiplier(me.rating) : lossMultiplier(me.rating);
    const updated = Math.max(me.rating + change, Math.min(me.rating, RATING_FLOOR));
    changes[me.memberId] = updated - me.rating;
  }
  return changes;
};

const blank = () => ({ community: null, room: null, game: null, matches: [], nextMatchId: PRACTICE_ID });
let db = blank();

export const reset = () => { db = blank(); };

// 날짜는 커뮤니티 지역과 상관없이 기기 날짜로 충분하다 (연습 시즌 표시용)
const toDate = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const fail = (status, message) => {
  const error = new Error(message);
  error.practiceStatus = status;
  error.practiceData = { message };
  throw error;
};

const me = (ctx) => ({ memberId: Number(ctx.userId), nickname: ctx.nickname, profileImage: ctx.profileImage ?? null });
const friends = (ctx) => EXAMPLE_FRIEND_IDS.map((memberId, i) => ({
  memberId, nickname: ctx.friendNames[i], profileImage: null, isExample: true,
}));
const members = (ctx) => [me(ctx), ...friends(ctx)];
const MEMBER_COUNT = EXAMPLE_FRIEND_IDS.length + 1;

// 매치를 처음부터 다시 돌려 각자 점수와 매치별 변화를 만든다 (수정·삭제가 있어도 늘 맞다)
const replay = (ctx) => {
  const stats = new Map(members(ctx).map(m => [m.memberId, {
    rating: INITIAL_RATING, playCount: 0, winCount: 0, loseCount: 0, placementCounts: [0, 0, 0, 0],
  }]));
  const changesByMatch = new Map();
  for (const match of db.matches) {
    const players = match.participants.map(p => ({ ...p, ...stats.get(p.memberId) }));
    const changes = calculateRatingChanges(players);
    changesByMatch.set(match.matchId, changes);
    for (const p of match.participants) {
      const s = stats.get(p.memberId);
      s.rating += changes[p.memberId];
      s.playCount += 1;
      if (p.placement === 1) s.winCount += 1; else s.loseCount += 1;
      if (p.placement <= 4) s.placementCounts[p.placement - 1] += 1;
    }
  }
  return { stats, changesByMatch };
};

const communityResponse = (ctx) => ({
  communityId: db.community.communityId,
  name: db.community.name,
  region: db.community.region,
  imageUrl: null,
  status: 'ACTIVE',
  memberCount: MEMBER_COUNT,
  groupCount: db.room ? 1 : 0,
  admins: [me(ctx)],
  inviteCode: PRACTICE_INVITE_CODE,
  createdBy: Number(ctx.userId),
});

const roomListItem = () => ({
  roomId: db.room.roomId,
  roomName: db.room.roomName,
  inviteCode: PRACTICE_INVITE_CODE,
  boardGameId: db.room.boardGameId,
  imageUrl: db.game?.imageUrl ?? null,
  sessionActive: false,
  isMember: true,
  memberCount: MEMBER_COUNT,
});

const seasonResponse = () => {
  const s = db.room.season;
  return {
    seasonId: PRACTICE_ID,
    seasonNumber: 1,
    name: s.name,
    startDate: s.startDate,
    endDate: s.endDate,
    startAt: s.startAt,
    endAt: s.endAt,
    closed: false,
    seasonKey: s.endDate.slice(0, 7),
    matchCount: db.matches.length,
    playerCount: new Set(db.matches.flatMap(m => m.participants.map(p => p.memberId))).size,
  };
};

const rankings = (ctx) => {
  const { stats } = replay(ctx);
  return members(ctx)
    .map(m => ({ ...m, ...stats.get(m.memberId) }))
    // 백엔드처럼 뛴 사람이 먼저, 그다음 점수순. 안 뛴 사람도 게임방 멤버라 목록에 있다 (500점)
    .sort((a, b) => (b.playCount > 0) - (a.playCount > 0) || b.rating - a.rating)
    .map((m, i) => ({
      rank: m.playCount > 0 ? i + 1 : null,
      memberId: m.memberId,
      nickname: m.nickname,
      profileImage: m.profileImage,
      rating: m.rating,
      playCount: m.playCount,
      winCount: m.winCount,
      loseCount: m.loseCount,
      placementCounts: m.placementCounts,
      rebuyCount: null,
    }));
};

const matchHistory = (ctx) => {
  const { changesByMatch } = replay(ctx);
  const byId = new Map(members(ctx).map(m => [m.memberId, m]));
  return [...db.matches].reverse().map(match => ({
    matchId: match.matchId,
    boardGameId: db.room.boardGameId,
    gameName: db.game?.name ?? '',
    playedAt: match.playedAt,
    participants: match.participants.map(p => ({
      memberId: p.memberId,
      nickname: byId.get(p.memberId)?.nickname,
      profileImage: byId.get(p.memberId)?.profileImage ?? null,
      placement: p.placement,
      ratingChange: changesByMatch.get(match.matchId)[p.memberId],
      scoresJson: p.scoresJson ?? null,
    })),
  }));
};

const resultResponse = (ctx, matchId) => {
  const { changesByMatch } = replay(ctx);
  const byId = new Map(members(ctx).map(m => [m.memberId, m]));
  const match = db.matches.find(m => m.matchId === matchId);
  return [...match.participants]
    .sort((a, b) => a.placement - b.placement)
    .map(p => ({
      memberId: p.memberId,
      nickname: byId.get(p.memberId)?.nickname,
      placement: p.placement,
      ratingChange: changesByMatch.get(matchId)[p.memberId],
    }));
};

// 명예의 전당 (커뮤니티 현황). 연습 경기만으로 채운다
const communityStatus = (ctx) => {
  const ranked = db.room ? rankings(ctx) : [];
  const history = db.room ? matchHistory(ctx) : [];
  const today = toDate(new Date());
  const awards = [];
  const played = ranked.filter(r => r.playCount > 0);
  if (history.length) {
    history[0].participants.filter(p => p.placement === 1).forEach(p => awards.push({
      type: 'LAST_WINNER', memberId: p.memberId, nickname: p.nickname, profileImage: p.profileImage,
      value: 0, boardGameName: db.game?.name ?? null,
    }));
    const top = (key) => [...played].sort((a, b) => b[key] - a[key])[0];
    const mostWins = top('winCount');
    if (mostWins?.winCount > 0) awards.push({ type: 'MOST_WINS', ...pick(mostWins), value: mostWins.winCount, boardGameName: null });
    const mostPlayed = top('playCount');
    awards.push({ type: 'MOST_PLAYED', ...pick(mostPlayed), value: mostPlayed.playCount, boardGameName: null });
    awards.push({ type: 'MOST_RECORDED', ...pick(me(ctx)), value: history.length, boardGameName: null });
  }
  return {
    communityId: db.community.communityId,
    communityName: db.community.name,
    communityImageUrl: null,
    inviteCode: PRACTICE_INVITE_CODE,
    from: today,
    to: today,
    windowDays: 1,
    totalRooms: db.room ? 1 : 0,
    totalMembers: MEMBER_COUNT,
    matchCount: history.length,
    leaders: played.length ? [{
      rank: 1, ...pick(played[0]), displayScore: played[0].rating,
      roomName: db.room.roomName, boardGameName: db.game?.name ?? null,
    }] : [],
    awards,
  };
};

const pick = (m) => ({ memberId: m.memberId, nickname: m.nickname, profileImage: m.profileImage ?? null });

const myStats = (ctx) => {
  if (!db.room) return { stats: null };
  const { stats } = replay(ctx);
  return { stats: stats.get(Number(ctx.userId)) };
};

const routes = [
  // 커뮤니티
  ['GET', /^\/communities\/my\/list\/[^/]+$/, (ctx) => (db.community ? [communityResponse(ctx)] : [])],
  ['GET', /^\/communities\/joined\/[^/]+$/, () => []],
  ['POST', /^\/communities$/, (ctx, body) => {
    db.community = { communityId: PRACTICE_ID, name: body?.name?.trim() || ctx.defaultCommunityName, region: body?.region ?? null };
    return communityResponse(ctx);
  }],
  ['DELETE', /^\/communities\/\d+$/, () => { reset(); return null; }],
  ['GET', /^\/communities\/\d+\/members$/, (ctx) => members(ctx).map(pick)],
  ['GET', /^\/communities\/\d+\/rooms$/, () => (db.room ? [roomListItem()] : [])],
  ['GET', /^\/communities\/\d+\/status$/, (ctx) => communityStatus(ctx)],
  ['GET', /^\/communities\/\d+$/, (ctx) => communityResponse(ctx)],

  // 게임방
  ['GET', /^\/rooms\/my\/[^/]+$/, () => (db.room ? [roomListItem()] : [])],
  ['POST', /^\/rooms$/, async (ctx, body) => {
    db.game = await ctx.fetchGame(body.boardGameId).catch(() => null);
    const now = new Date();
    const start = new Date(now.getTime() - 60 * 1000);
    const end = new Date(`${body.seasonEndDate}T00:00:00`);
    end.setDate(end.getDate() + 1);
    db.room = {
      roomId: PRACTICE_ID,
      roomName: body.roomName,
      boardGameId: body.boardGameId,
      season: {
        name: body.seasonName?.trim() || null,
        startDate: toDate(now),
        endDate: body.seasonEndDate,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      },
    };
    return { roomId: PRACTICE_ID, roomName: body.roomName, inviteCode: PRACTICE_INVITE_CODE, boardGameId: body.boardGameId };
  }],
  ['GET', /^\/rooms\/\d+\/members$/, (ctx) => members(ctx).map(m => ({
    memberId: m.memberId, nickname: m.nickname, isHost: m.memberId === Number(ctx.userId), profileImage: m.profileImage,
  }))],
  ['GET', /^\/rooms\/\d+\/rankings$/, (ctx, _body, params) => (params.seasonId ? [] : rankings(ctx))],
  ['GET', /^\/rooms\/\d+\/matches$/, (ctx) => matchHistory(ctx)],
  ['GET', /^\/rooms\/\d+\/seasons\/current$/, () => seasonResponse()],
  ['GET', /^\/rooms\/\d+\/seasons\/\d+\/podium$/, () => []],
  ['GET', /^\/rooms\/\d+\/seasons$/, () => []],
  ['GET', /^\/rooms\/\d+$/, () => ({
    roomId: db.room.roomId, roomName: db.room.roomName, inviteCode: PRACTICE_INVITE_CODE, boardGameId: db.room.boardGameId,
  })],

  // 매치
  ['POST', /^\/matches$/, (ctx, body) => {
    const matchId = db.nextMatchId++;
    db.matches.push({
      matchId,
      playedAt: new Date().toISOString(),
      participants: body.participants.map(p => ({ memberId: Number(p.memberId), placement: p.placement, scoresJson: p.scoresJson })),
    });
    return resultResponse(ctx, matchId);
  }],
  ['PUT', /^\/matches\/\d+$/, (ctx, body, _params, path) => {
    const matchId = Number(path.split('/').pop());
    const match = db.matches.find(m => m.matchId === matchId);
    if (!match) fail(404, 'not found');
    match.participants = body.participants.map(p => ({ memberId: Number(p.memberId), placement: p.placement, scoresJson: p.scoresJson }));
    return resultResponse(ctx, matchId);
  }],
  ['DELETE', /^\/matches\/\d+$/, (_ctx, _body, _params, path) => {
    const matchId = Number(path.split('/').pop());
    db.matches = db.matches.filter(m => m.matchId !== matchId);
    return null;
  }],

  // 회원 (프로필)
  ['GET', /^\/members\/[^/]+\/stats$/, (ctx) => {
    const { stats } = myStats(ctx);
    const play = stats?.playCount ?? 0;
    return {
      totalPlay: play,
      totalWin: stats?.winCount ?? 0,
      totalLose: stats?.loseCount ?? 0,
      games: play ? [{ gameName: db.game?.name ?? '', playCount: play, winCount: stats.winCount, loseCount: stats.loseCount }] : [],
    };
  }],
  // 시즌이 끝나야 생기는 트로피를 미리 보여 준다 (화면에 「예시」 표시)
  ['GET', /^\/members\/[^/]+\/trophies$/, () => (db.matches.length ? [{
    seasonKey: db.room.season.endDate.slice(0, 7),
    seasonId: PRACTICE_ID,
    seasonNumber: 1,
    seasonName: db.room.season.name,
    roomId: db.room.roomId,
    roomName: db.room.roomName,
    boardGameId: db.room.boardGameId,
    boardGameName: db.game?.name ?? '',
    rank: 1,
    isExample: true,
  }] : [])],
  ['GET', /^\/members\/[^/]+\/season-history$/, () => []],
  ['GET', /^\/members\/[^/]+$/, (ctx) => {
    const { stats } = myStats(ctx);
    return {
      memberId: Number(ctx.userId),
      nickname: ctx.nickname,
      overallRating: Math.max(INITIAL_RATING, stats?.rating ?? INITIAL_RATING),
      overallRd: 0,
      profileImage: ctx.profileImage ?? null,
    };
  }],

  // 계측은 연습에서 남기지 않는다
  ['POST', /^\/events$/, () => null],
];

// 게임 목록·점수판은 실제 서버에서 읽는다 (읽기만 하고 바꾸지 않는다)
export const isPassthrough = (method, path) => method === 'GET' && /^\/games(\/\d+)?$/.test(path);

/**
 * 요청 하나를 처리한다. 실제 서버로 보내야 하는 요청이면 null을 돌려준다.
 * 저장하는 요청 중 연습에 없는 것(사진 올리기, 설정 저장 등)은 409로 막는다.
 */
export const handlePracticeRequest = async ({ method, path, params = {}, body }, ctx) => {
  if (isPassthrough(method, path)) return null;
  const route = routes.find(([m, re]) => m === method && re.test(path));
  if (!route) fail(409, ctx.blockedMessage);
  const needsRoom = /^\/(rooms\/\d+|matches)/.test(path);
  if (needsRoom && !db.room) fail(404, 'not found');
  if (/^\/communities\/\d+/.test(path) && !db.community) fail(404, 'not found');
  return { status: 200, data: await route[2](ctx, body, params, path) };
};

import { beforeEach, describe, expect, it } from 'vitest';
import { calculateRatingChanges, handlePracticeRequest, reset } from './practiceServer';
import { EXAMPLE_FRIEND_IDS } from './practiceState';

const ctx = {
  userId: '7',
  nickname: '민지',
  profileImage: null,
  friendNames: ['준호', '서연', '도윤', '하은'],
  defaultCommunityName: '우리 보드게임 모임',
  blockedMessage: '연습 중에는 할 수 없어요',
  fetchGame: async (id) => ({ id, name: '카탄', imageUrl: 'x.png' }),
};

const call = (method, path, body, params) => handlePracticeRequest({ method, path, body, params }, ctx);

const setUpRoom = async () => {
  const community = (await call('POST', '/communities', { name: '우리 보드게임 모임', region: 'South Korea' })).data;
  const room = (await call('POST', '/rooms', {
    roomName: '금요일 카탄', boardGameId: 1, communityId: community.communityId, seasonName: '', seasonEndDate: '2027-02-17',
  })).data;
  return { community, room };
};

describe('연습 가짜 서버', () => {
  beforeEach(() => reset());

  it('백엔드 Elo와 같이 계산한다 — 500 동점 2인전: 1등 +187.5(캐주얼 ×1.25), 2등은 하한 500', () => {
    const changes = calculateRatingChanges([
      { memberId: 1, placement: 1, rating: 500, playCount: 0 },
      { memberId: 2, placement: 2, rating: 500, playCount: 0 },
    ]);
    expect(changes[1]).toBeCloseTo(187.5);
    expect(changes[2]).toBe(0);
  });

  it('500 동점 3인전: 1등 +187.5, 2등 +37.5(꼴등 몫 이전 포함), 꼴등은 하한 500', () => {
    const changes = calculateRatingChanges([1, 2, 3].map(i => ({ memberId: i, placement: i, rating: 500, playCount: 0 })));
    expect(changes[1]).toBeCloseTo(187.5);
    expect(changes[2]).toBeCloseTo(37.5);
    expect(changes[3]).toBe(0);
  });

  it('모임을 만들면 예시 친구 4명이 이미 들어와 있다', async () => {
    const { community } = await setUpRoom();
    expect(community.memberCount).toBe(5);
    expect(community.admins[0].memberId).toBe(7);
    const members = (await call('GET', `/communities/${community.communityId}/members`)).data;
    expect(members.map(m => m.memberId)).toEqual([7, ...EXAMPLE_FRIEND_IDS]);
  });

  it('경기를 넣으면 랭킹·매치기록·명예의 전당·프로필에 반영된다', async () => {
    const { community, room } = await setUpRoom();
    const before = (await call('GET', `/rooms/${room.roomId}/rankings`)).data;
    expect(before.map(r => r.rating)).toEqual([500, 500, 500, 500, 500]);
    expect(before.every(r => r.rank === null)).toBe(true);

    const [junho, seoyeon, , haeun] = EXAMPLE_FRIEND_IDS;
    const result = (await call('POST', '/matches', {
      boardGameId: 1, roomId: room.roomId,
      participants: [
        { memberId: 7, placement: 1, scoresJson: '{}' },
        { memberId: junho, placement: 2, scoresJson: '{}' },
        { memberId: haeun, placement: 3, scoresJson: '{}' },
      ],
    })).data;
    expect(result[0]).toMatchObject({ memberId: 7, placement: 1, nickname: '민지' });
    expect(result[0].ratingChange).toBeCloseTo(187.5);

    const after = (await call('GET', `/rooms/${room.roomId}/rankings`)).data;
    expect(after[0]).toMatchObject({ memberId: 7, rank: 1, playCount: 1, winCount: 1, placementCounts: [1, 0, 0, 0] });
    expect(after[1]).toMatchObject({ memberId: junho, rank: 2, rating: 537.5, loseCount: 1 });
    // 뛴 사람(하은 500)이 안 뛴 사람(서연 500)보다 앞, 안 뛴 사람은 순위 없음
    expect(after[2]).toMatchObject({ memberId: haeun, rank: 3, rating: 500 });
    expect(after[3]).toMatchObject({ memberId: seoyeon, rank: null, playCount: 0 });

    const matches = (await call('GET', `/rooms/${room.roomId}/matches`)).data;
    expect(matches).toHaveLength(1);
    expect(matches[0].gameName).toBe('카탄');

    const status = (await call('GET', `/communities/${community.communityId}/status`)).data;
    expect(status.matchCount).toBe(1);
    expect(status.awards.map(a => a.type)).toEqual(['LAST_WINNER', 'MOST_WINS', 'MOST_PLAYED', 'MOST_RECORDED']);

    const profile = (await call('GET', '/members/7')).data;
    expect(profile.overallRating).toBeCloseTo(687.5);
    const trophies = (await call('GET', '/members/7/trophies')).data;
    expect(trophies[0]).toMatchObject({ rank: 1, isExample: true, roomName: '금요일 카탄' });
  });

  it('경기를 지우면 처음부터 다시 계산한다', async () => {
    const { room } = await setUpRoom();
    const body = { participants: [{ memberId: 7, placement: 2 }, { memberId: EXAMPLE_FRIEND_IDS[0], placement: 1 }] };
    await call('POST', '/matches', body);
    const [match] = (await call('GET', `/rooms/${room.roomId}/matches`)).data;
    await call('DELETE', `/matches/${match.matchId}`);
    const rankings = (await call('GET', `/rooms/${room.roomId}/rankings`)).data;
    expect(rankings.every(r => r.rating === 500 && r.playCount === 0)).toBe(true);
  });

  it('게임 목록 읽기는 실제 서버로 보낸다', async () => {
    expect(await call('GET', '/games')).toBeNull();
    expect(await call('GET', '/games/1')).toBeNull();
  });

  it('연습에 없는 저장 요청은 409로 막는다', async () => {
    await setUpRoom();
    await expect(call('PATCH', '/communities/900000001', { name: 'x' })).rejects.toMatchObject({ practiceStatus: 409 });
    await expect(call('POST', '/upload/community-image', {})).rejects.toMatchObject({ practiceStatus: 409 });
    await expect(call('PATCH', '/members/7/nickname', { nickname: 'x' })).rejects.toMatchObject({ practiceStatus: 409 });
  });

  it('지난 시즌 순위 요청에는 빈 목록을 준다', async () => {
    const { room } = await setUpRoom();
    expect((await call('GET', `/rooms/${room.roomId}/rankings`, null, { seasonId: '1' })).data).toEqual([]);
  });
});

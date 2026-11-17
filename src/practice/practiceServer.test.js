import { beforeEach, describe, expect, it } from 'vitest';
import { calculateRatingChanges, handlePracticeRequest, reset, EXAMPLE_FRIEND_ID } from './practiceServer';

const ctx = {
  userId: '7',
  nickname: '민지',
  profileImage: null,
  friendName: '준호',
  defaultCommunityName: '우리 보드게임 모임',
  blockedMessage: '연습 중에는 할 수 없어요',
  fetchGame: async (id) => ({ id, name: '스플렌더', imageUrl: 'x.png' }),
};

const call = (method, path, body, params) => handlePracticeRequest({ method, path, body, params }, ctx);

const setUpRoom = async () => {
  const community = (await call('POST', '/communities', { name: '우리 보드게임 모임', region: 'South Korea' })).data;
  const room = (await call('POST', '/rooms', {
    roomName: '금요일 스플렌더', boardGameId: 10, communityId: community.communityId, seasonName: '', seasonEndDate: '2027-02-17',
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

  it('모임을 만들면 예시 친구가 이미 들어와 있다', async () => {
    const { community } = await setUpRoom();
    expect(community.memberCount).toBe(2);
    expect(community.admins[0].memberId).toBe(7);
    const members = (await call('GET', `/communities/${community.communityId}/members`)).data;
    expect(members.map(m => m.memberId)).toEqual([7, EXAMPLE_FRIEND_ID]);
  });

  it('경기를 넣으면 랭킹·매치기록·명예의 전당·프로필에 반영된다', async () => {
    const { community, room } = await setUpRoom();
    const before = (await call('GET', `/rooms/${room.roomId}/rankings`)).data;
    expect(before.map(r => r.rating)).toEqual([500, 500]);

    const result = (await call('POST', '/matches', {
      boardGameId: 10, roomId: room.roomId,
      participants: [{ memberId: 7, placement: 1, scoresJson: '{}' }, { memberId: EXAMPLE_FRIEND_ID, placement: 2, scoresJson: '{}' }],
    })).data;
    expect(result[0]).toMatchObject({ memberId: 7, placement: 1, nickname: '민지' });
    expect(result[0].ratingChange).toBeCloseTo(187.5);

    const after = (await call('GET', `/rooms/${room.roomId}/rankings`)).data;
    expect(after[0]).toMatchObject({ memberId: 7, rank: 1, playCount: 1, winCount: 1, placementCounts: [1, 0, 0, 0] });
    expect(after[1]).toMatchObject({ memberId: EXAMPLE_FRIEND_ID, rating: 500, loseCount: 1 });

    const matches = (await call('GET', `/rooms/${room.roomId}/matches`)).data;
    expect(matches).toHaveLength(1);
    expect(matches[0].gameName).toBe('스플렌더');

    const status = (await call('GET', `/communities/${community.communityId}/status`)).data;
    expect(status.matchCount).toBe(1);
    expect(status.awards.map(a => a.type)).toEqual(['LAST_WINNER', 'MOST_WINS', 'MOST_PLAYED', 'MOST_RECORDED']);

    const profile = (await call('GET', '/members/7')).data;
    expect(profile.overallRating).toBeCloseTo(687.5);
    const trophies = (await call('GET', '/members/7/trophies')).data;
    expect(trophies[0]).toMatchObject({ rank: 1, isExample: true, roomName: '금요일 스플렌더' });
  });

  it('경기를 지우면 처음부터 다시 계산한다', async () => {
    const { room } = await setUpRoom();
    const body = { participants: [{ memberId: 7, placement: 2 }, { memberId: EXAMPLE_FRIEND_ID, placement: 1 }] };
    await call('POST', '/matches', body);
    const [match] = (await call('GET', `/rooms/${room.roomId}/matches`)).data;
    await call('DELETE', `/matches/${match.matchId}`);
    const rankings = (await call('GET', `/rooms/${room.roomId}/rankings`)).data;
    expect(rankings.every(r => r.rating === 500 && r.playCount === 0)).toBe(true);
  });

  it('게임 목록 읽기는 실제 서버로 보낸다', async () => {
    expect(await call('GET', '/games')).toBeNull();
    expect(await call('GET', '/games/10')).toBeNull();
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

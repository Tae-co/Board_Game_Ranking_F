import { describe, it, expect } from 'vitest';
import { mergeRankedMembers, getMyStreak, getWinRate } from './roomStats';

const match = (playedAt, ...placements) => ({
  playedAt, participants: placements.map(([memberId, placement]) => ({ memberId, placement })),
});

describe('mergeRankedMembers', () => {
  it('랭킹 순서대로 멤버 정보를 합치고 순위를 매긴다, 경기 없는 멤버는 뒤에', () => {
    const members = [{ memberId: 1, nickname: 'a', isHost: true }, { memberId: 2, nickname: 'b' }, { memberId: 3, nickname: 'c' }];
    const rankings = [{ memberId: 2, rating: 700 }, { memberId: 1, rating: 600 }];
    expect(mergeRankedMembers(members, rankings)).toEqual([
      { memberId: 2, nickname: 'b', rating: 700, rankPosition: 1 },
      { memberId: 1, nickname: 'a', isHost: true, rating: 600, rankPosition: 2 },
      { memberId: 3, nickname: 'c', hasRank: false },
    ]);
  });
  it('랭킹에만 있고 멤버에 없는(나간) 사람도 랭킹 값으로 남는다', () => {
    expect(mergeRankedMembers([], [{ memberId: 9, rating: 500 }])).toEqual([{ memberId: 9, rating: 500, rankPosition: 1 }]);
  });
});

describe('getMyStreak', () => {
  it('최근 경기부터 1등이 이어진 판 수', () => {
    const matches = [
      match('2026-11-01', [1, 1], [2, 2]),
      match('2026-11-03', [1, 1], [2, 2]),
      match('2026-11-02', [1, 1], [2, 2]),
      match('2026-10-30', [1, 2], [2, 1]),
    ];
    expect(getMyStreak(matches, 1)).toEqual({ count: 3, isWin: true });
    expect(getMyStreak(matches, 2)).toEqual({ count: 3, isWin: false });
  });
  it('내가 안 낀 경기는 건너뛰고, 경기가 없으면 null', () => {
    const matches = [match('2026-11-05', [3, 1]), match('2026-11-01', [1, 2])];
    expect(getMyStreak(matches, 1)).toEqual({ count: 1, isWin: false });
    expect(getMyStreak(matches, 7)).toBeNull();
    expect(getMyStreak([], 1)).toBeNull();
  });
});

describe('getWinRate', () => {
  it('반올림한 퍼센트, 기록 없으면 0', () => {
    expect(getWinRate({ winCount: 1, loseCount: 2 })).toBe(33);
    expect(getWinRate({ winCount: 0, loseCount: 0 })).toBe(0);
    expect(getWinRate(undefined)).toBe(0);
  });
});

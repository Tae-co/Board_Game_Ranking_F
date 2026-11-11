import { describe, it, expect } from 'vitest';
import { buildSavedScores } from './savedScores';

describe('buildSavedScores', () => {
  it('칸별 점수: 칸 → 멤버 → 값으로 모은다', () => {
    const res = buildSavedScores([
      { memberId: 1, scoresJson: '{"a":3,"b":5}' },
      { memberId: 2, scoresJson: '{"a":7}' },
    ]);
    expect(res).toEqual({ a: { 1: 3, 2: 7 }, b: { 1: 5 } });
  });
  it('라운드제·HP제: 첫 기록 전체를 _data.all로 그대로', () => {
    const rounds = '{"rounds":[[1,2]]}';
    expect(buildSavedScores([{ memberId: 1, scoresJson: null }, { memberId: 2, scoresJson: rounds }]))
      .toEqual({ _data: { all: rounds } });
    const hp = '{"hpMap":{"1":10}}';
    expect(buildSavedScores([{ memberId: 1, scoresJson: hp }])).toEqual({ _data: { all: hp } });
  });
  it('기록이 없거나 첫 기록이 깨졌으면 null', () => {
    expect(buildSavedScores([])).toBeNull();
    expect(buildSavedScores([{ memberId: 1, scoresJson: null }])).toBeNull();
    expect(buildSavedScores([{ memberId: 1, scoresJson: '{깨짐' }])).toBeNull();
    expect(buildSavedScores([{ memberId: 1, scoresJson: '{}' }])).toBeNull();
  });
  it('뒤쪽 기록이 깨진 건 건너뛴다', () => {
    expect(buildSavedScores([
      { memberId: 1, scoresJson: '{"a":1}' },
      { memberId: 2, scoresJson: '{깨짐' },
    ])).toEqual({ a: { 1: 1 } });
  });
});

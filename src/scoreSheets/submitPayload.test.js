import { describe, it, expect } from 'vitest';
import { buildParticipants, computeTotals, rankByScore } from './submitPayload';
import { SCORE_SCHEMAS } from './schemas/index';

const P = (...ids) => ids.map(id => ({ memberId: id, nickname: `p${id}` }));
const placements = (res) => Object.fromEntries(res.participants.map(p => [p.memberId, p.placement]));
const parsed = (res, id) => JSON.parse(res.participants.find(p => p.memberId === id).scoresJson);

// 입력 기본값 — 각 테스트는 필요한 것만 덮어쓴다
const base = {
  scores: {}, duelWinnerId: null, duelWinCondition: null, outcomeInputs: {},
  chipCountDeltas: {}, chipStart: '', chipCounts: {},
  chipResults: null, chipWinnerIds: [], chipBuyIns: {}, chipBuyIn: '',
  rankMode: false, rankInputs: {}, roundTotals: {},
};

describe('rankByScore', () => {
  it('높은 점수가 1위, 같은 점수는 동순위, 다음은 건너뛴다', () => {
    expect(rankByScore(P(1, 2, 3, 4), { 1: 10, 2: 7, 3: 7, 4: 3 }, false)).toEqual({ 1: 1, 2: 2, 3: 2, 4: 4 });
  });
  it('lowestWins면 낮은 점수가 1위', () => {
    expect(rankByScore(P(1, 2, 3), { 1: 30, 2: 5, 3: 12 }, true)).toEqual({ 2: 1, 3: 2, 1: 3 });
  });
  it('전원 동점이면 전원 1위', () => {
    expect(rankByScore(P(1, 2, 3), { 1: 4, 2: 4, 3: 4 }, false)).toEqual({ 1: 1, 2: 1, 3: 1 });
  });
});

describe('computeTotals', () => {
  it('카탄: 도시 ×2, 최장 도로·최대 군대 체크는 +2', () => {
    const scores = {
      settlement: { 1: '3', 2: '2' }, cities: { 1: '2', 2: '1' },
      longest_road: { 1: true, 2: false }, largest_army: { 1: false, 2: true }, vp_cards: { 1: '1', 2: '' },
    };
    expect(computeTotals({ schema: SCORE_SCHEMAS[1], players: P(1, 2), scores })).toEqual({ 1: 3 + 4 + 2 + 1, 2: 2 + 2 + 2 });
  });
  it('감점 칸(negative)은 입력 부호와 상관없이 뺀다 — 아줄', () => {
    const azul = SCORE_SCHEMAS[4];
    const scores = Object.fromEntries(azul.categories.map(c => [c.key, { 1: '5' }]));
    scores.negative = { 1: '3' };
    const positive = azul.categories.filter(c => !c.negative).length * 5;
    expect(computeTotals({ schema: azul, players: P(1), scores })[1]).toBe(positive - 3);
    scores.negative = { 1: '-3' };
    expect(computeTotals({ schema: azul, players: P(1), scores })[1]).toBe(positive - 3);
  });
  it('allowNegative 칸은 음수를 그대로 더한다 — 7원더스 군사', () => {
    expect(computeTotals({ schema: SCORE_SCHEMAS[2], players: P(1), scores: { military: { 1: '-4' } } })[1]).toBe(-4);
  });
  it('섹션형(카스카디아)은 모든 섹션 칸을 더한다, 빈 칸·숫자 아님은 0', () => {
    const cascadia = SCORE_SCHEMAS[3];
    const cats = cascadia.sections.flatMap(s => s.categories);
    const scores = Object.fromEntries(cats.map((c, i) => [c.key, { 1: i === 0 ? 'x' : '1' }]));
    expect(computeTotals({ schema: cascadia, players: P(1), scores })[1]).toBe(cats.length - 1);
  });
  it('라운드제는 테이블이 준 roundTotals를 그대로 쓴다', () => {
    const roundTotals = { 1: 50, 2: 20 };
    expect(computeTotals({ schema: SCORE_SCHEMAS[8], players: P(1, 2), scores: {}, roundTotals })).toBe(roundTotals);
  });
});

describe('buildParticipants', () => {
  it('일반 점수 게임: 합계 순위 + 칸별 점수를 scoresJson으로', () => {
    const schema = { type: 'flat', categories: [{ key: 'a' }, { key: 'b' }] };
    const res = buildParticipants({ ...base, schema, players: P(1, 2, 3), scores: { a: { 1: '5', 2: '9', 3: '5' }, b: { 1: '1', 2: '0', 3: '1' } } });
    expect(placements(res)).toEqual({ 1: 2, 2: 1, 3: 2 });
    expect(parsed(res, 1)).toEqual({ a: '5', b: '1' });
  });

  it('카탄: 체크 보너스가 순위를 가른다', () => {
    const scores = { settlement: { 1: '4', 2: '4' }, cities: { 1: '0', 2: '0' }, longest_road: { 1: false, 2: true }, largest_army: { 1: false, 2: false }, vp_cards: { 1: '', 2: '' } };
    const res = buildParticipants({ ...base, schema: SCORE_SCHEMAS[1], players: P(1, 2), scores });
    expect(placements(res)).toEqual({ 1: 2, 2: 1 });
    expect(parsed(res, 2).longest_road).toBe(true);
  });

  it('조건 승리(conditional): 승자 1등·나머지 2등, 승리 조건 저장', () => {
    const schema = { type: 'conditional', categories: [] };
    expect(buildParticipants({ ...base, schema, players: P(1, 2) })).toEqual({ error: 'winnerRequired' });
    const res = buildParticipants({ ...base, schema, players: P(1, 2), duelWinnerId: 2, duelWinCondition: 'ring' });
    expect(placements(res)).toEqual({ 1: 2, 2: 1 });
    expect(parsed(res, 2)).toEqual({ win_condition: 'ring', won: true });
    expect(parsed(res, 1)).toEqual({ win_condition: 'ring', won: false });
  });

  it('1:1 대결(7원더스 대결·스플렌더 대결): 승자 1등, 칸 점수 없으면 0', () => {
    for (const id of [6, 15]) {
      const schema = SCORE_SCHEMAS[id];
      expect(buildParticipants({ ...base, schema, players: P(1, 2) })).toEqual({ error: 'winnerRequired' });
      const res = buildParticipants({ ...base, schema, players: P(1, 2), duelWinnerId: 1, duelWinCondition: 'military' });
      expect(placements(res)).toEqual({ 1: 1, 2: 2 });
      expect(parsed(res, 1)).toMatchObject({ win_condition: 'military', won: true });
    }
  });

  it('승/무/패: 승→무→패 순, 같은 결과는 동순위 (승/무/무/패 → 1,2,2,4)', () => {
    const schema = { type: 'outcome' };
    expect(buildParticipants({ ...base, schema, players: P(1, 2), outcomeInputs: { 1: 'win' } })).toEqual({ error: 'outcomeRequired' });
    const res = buildParticipants({ ...base, schema, players: P(1, 2, 3, 4), outcomeInputs: { 1: 'draw', 2: 'loss', 3: 'win', 4: 'draw' } });
    expect(placements(res)).toEqual({ 3: 1, 1: 2, 4: 2, 2: 4 });
    expect(parsed(res, 2)).toEqual({ outcome: 'loss' });
  });

  it('칩 세기: 많이 남긴 순, 같은 금액 동순위, 합계 0이면 확인 없이 저장', () => {
    const schema = { type: 'chip', chipMode: 'count' };
    const res = buildParticipants({
      ...base, schema, players: P(1, 2, 3, 4),
      chipCountDeltas: { 1: 0, 2: 300, 3: -300, 4: 0 }, chipStart: '1000', chipCounts: { 1: { 100: 10 } },
    });
    expect(placements(res)).toEqual({ 2: 1, 1: 2, 4: 2, 3: 4 });
    expect(res.confirmChipSum).toBeUndefined();
    expect(res.participants.find(p => p.memberId === 2)).toMatchObject({ chipDelta: 300, buyIns: 1 });
    expect(parsed(res, 1)).toEqual({ chip: 0, chipStart: 1000, chipCounts: { 100: 10 } });
  });

  it('칩 세기: 빈 사람 있으면 오류, 너무 크면 오류, 합계가 0이 아니면 확인 요청', () => {
    const schema = { type: 'chip', chipMode: 'count' };
    expect(buildParticipants({ ...base, schema, players: P(1, 2), chipCountDeltas: { 1: 10, 2: null } })).toEqual({ error: 'chipCountRequired' });
    expect(buildParticipants({ ...base, schema, players: P(1, 2), chipCountDeltas: { 1: 3e9, 2: -3e9 } })).toEqual({ error: 'chipTooLarge' });
    const res = buildParticipants({ ...base, schema, players: P(1, 2), chipCountDeltas: { 1: 100, 2: -50 }, chipStart: '500' });
    expect(res.confirmChipSum).toBe(50);
    expect(placements(res)).toEqual({ 1: 1, 2: 2 });
  });

  it('칩 바이인: 우승자 전원 1등·나머지 2등, 바이인 정보 저장', () => {
    const schema = { type: 'chip' };
    const input = { ...base, schema, players: P(1, 2, 3), chipBuyIn: '1000', chipBuyIns: { 1: 1, 2: 2, 3: 1 } };
    expect(buildParticipants({ ...input, chipResults: null })).toEqual({ error: 'chipRequired' });
    expect(buildParticipants({ ...input, chipResults: { 1: 0, 2: 0, 3: 0 }, chipWinnerIds: [1, 2, 3] })).toEqual({ error: 'chipAllWinners' });
    expect(buildParticipants({ ...input, chipResults: { 1: 3e9, 2: 0, 3: 0 }, chipWinnerIds: [1] })).toEqual({ error: 'chipTooLarge' });
    const res = buildParticipants({ ...input, chipResults: { 1: 3000, 2: -2000, 3: -1000 }, chipWinnerIds: [1] });
    expect(placements(res)).toEqual({ 1: 1, 2: 2, 3: 2 });
    expect(res.participants.find(p => p.memberId === 2)).toMatchObject({ chipDelta: -2000, buyIns: 2 });
    expect(parsed(res, 1)).toEqual({ chip: 3000, buyIn: 1000, buyIns: 1, chipWon: true });
  });

  it('순위 직접 입력(simple 게임 또는 순위 모드): 입력한 순위 그대로, scoresJson 없음', () => {
    expect(buildParticipants({ ...base, schema: { type: 'simple' }, players: P(1, 2), rankInputs: { 1: 1 } })).toEqual({ error: 'selectAllRanks' });
    const res = buildParticipants({ ...base, schema: { type: 'simple' }, players: P(1, 2), rankInputs: { 1: 2, 2: 1 } });
    expect(res.participants).toEqual([{ memberId: 1, placement: 2, scoresJson: null }, { memberId: 2, placement: 1, scoresJson: null }]);
    // 점수형 게임(카탄)이라도 순위 모드를 켜면 입력한 순위가 우선
    const ranked = buildParticipants({ ...base, schema: SCORE_SCHEMAS[1], players: P(1, 2), rankMode: true, rankInputs: { 1: 1, 2: 1 } });
    expect(placements(ranked)).toEqual({ 1: 1, 2: 1 });
  });

  it('라운드제: roundTotals로 순위, 전체 기록을 그대로 저장 (루미큐브는 낮은 점수가 1위)', () => {
    const scores = { _data: { all: '{"rounds":[1]}' } };
    const uno = buildParticipants({ ...base, schema: SCORE_SCHEMAS[8], players: P(1, 2), scores, roundTotals: { 1: 10, 2: 40 } });
    expect(placements(uno)).toEqual({ 1: 2, 2: 1 });
    expect(uno.participants[0].scoresJson).toBe('{"rounds":[1]}');
    const rummi = buildParticipants({ ...base, schema: SCORE_SCHEMAS[9], players: P(1, 2), scores, roundTotals: { 1: 10, 2: 40 } });
    expect(placements(rummi)).toEqual({ 1: 1, 2: 2 });
  });

  it('라운드제: 기록이 없으면 scoresJson은 null', () => {
    const res = buildParticipants({ ...base, schema: SCORE_SCHEMAS[17], players: P(1, 2), roundTotals: { 1: 1, 2: 0 } });
    expect(res.participants[0].scoresJson).toBeNull();
  });

  it('래드랜즈·다이스 스론: 승패를 안 고르면 오류', () => {
    for (const id of [14, 19]) {
      expect(buildParticipants({ ...base, schema: SCORE_SCHEMAS[id], players: P(1, 2) })).toEqual({ error: 'selectWinLoss' });
    }
  });
});

import { describe, it, expect } from 'vitest';
import { buildCustomSchemaJson, validateCustomGame } from './customSchema';
import { parseSchema } from './parseSchema';

const cats = (...labels) => labels.map((label, i) => ({ uid: `u${i}`, label, negative: label.startsWith('-') }));
const base = { name: ' 우리 게임 ', scoreType: 'flat', chipMode: 'buyin', denominations: [1, 5], categories: cats('점수'), minPlayers: 2, maxPlayers: 8 };

describe('buildCustomSchemaJson', () => {
  it('칸별 점수: 순서대로 c1·c2 키, 팔레트 색, 999 상한, 감점 칸만 negative', () => {
    const json = JSON.parse(buildCustomSchemaJson({ ...base, categories: cats(' 금화 ', '-빚') }));
    expect(json).toEqual({
      name: '우리 게임', type: 'flat',
      categories: [
        { key: 'c1', label: '금화', color: '#1d4ed8', maxScore: 999 },
        { key: 'c2', label: '-빚', color: '#0f766e', maxScore: 999, negative: true },
      ],
    });
  });
  it('항목이 팔레트(8색)보다 많으면 색이 처음부터 다시 돈다', () => {
    const json = JSON.parse(buildCustomSchemaJson({ ...base, categories: cats(...'abcdefghi') }));
    expect(json.categories[8].color).toBe(json.categories[0].color);
  });
  it('순위·승무패·바이인 칩은 이름과 type만', () => {
    for (const scoreType of ['simple', 'outcome', 'chip']) {
      expect(JSON.parse(buildCustomSchemaJson({ ...base, scoreType }))).toEqual({ name: '우리 게임', type: scoreType });
    }
  });
  it('칩 세기 방식은 chipMode·칩 종류까지', () => {
    expect(JSON.parse(buildCustomSchemaJson({ ...base, scoreType: 'chip', chipMode: 'count' })))
      .toEqual({ name: '우리 게임', type: 'chip', chipMode: 'count', denominations: [1, 5] });
  });
  it('만든 스키마는 parseSchema가 읽을 수 있다', () => {
    for (const scoreType of ['simple', 'flat', 'outcome', 'chip']) {
      expect(parseSchema(buildCustomSchemaJson({ ...base, scoreType }))).toMatchObject({ type: scoreType });
    }
  });
});

describe('validateCustomGame', () => {
  it('통과하면 null', () => {
    expect(validateCustomGame(base)).toBeNull();
  });
  it('이름 없음 → 인원 → 칩 종류 → 항목 순으로 막는다', () => {
    expect(validateCustomGame({ ...base, name: '  ', minPlayers: 0 })).toBe('customNameRequired');
    expect(validateCustomGame({ ...base, minPlayers: 0 })).toBe('customPlayersInvalid');
    expect(validateCustomGame({ ...base, minPlayers: 5, maxPlayers: 4 })).toBe('customPlayersInvalid');
    expect(validateCustomGame({ ...base, scoreType: 'chip', chipMode: 'count', denominations: [] })).toBe('customChipDenomsRequired');
    expect(validateCustomGame({ ...base, scoreType: 'chip', chipMode: 'buyin', denominations: [] })).toBeNull();
    expect(validateCustomGame({ ...base, categories: cats('a', ' ') })).toBe('customCategoryRequired');
    expect(validateCustomGame({ ...base, categories: [] })).toBe('customCategoryRequired');
    expect(validateCustomGame({ ...base, scoreType: 'simple', categories: cats('') })).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { parseSchema } from './parseSchema';
import FlatTable from './tables/FlatTable';
import SectionedTable from './tables/SectionedTable';
import ConditionTable from './tables/ConditionTable';

describe('parseSchema', () => {
  it('JSON 문자열·객체 모두 받는다, type에 맞는 표를 붙인다', () => {
    expect(parseSchema('{"type":"flat","categories":[]}')).toEqual({ type: 'flat', categories: [], TableComponent: FlatTable });
    expect(parseSchema({ type: 'sectioned', sections: [] }).TableComponent).toBe(SectionedTable);
    expect(parseSchema({ type: 'conditional' }).TableComponent).toBe(ConditionTable);
  });
  it('순위·승무패·칩 게임은 표 없이 (TableComponent null)', () => {
    for (const type of ['simple', 'outcome', 'chip']) {
      expect(parseSchema({ type, chipMode: 'count' })).toMatchObject({ type, TableComponent: null });
    }
  });
  it('비었거나 깨졌거나 모르는 type이면 null', () => {
    for (const raw of [null, '', '{깨짐', 'null', '{"type":"catan"}', '{"type":"toString"}', '{}']) {
      expect(parseSchema(raw)).toBeNull();
    }
  });
});

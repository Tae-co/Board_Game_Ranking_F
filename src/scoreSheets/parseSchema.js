import FlatTable from './tables/FlatTable';
import SectionedTable from './tables/SectionedTable';
import ConditionTable from './tables/ConditionTable';

const TABLES = { flat: FlatTable, sectioned: SectionedTable, conditional: ConditionTable, simple: null, outcome: null, chip: null };

/**
 * DB에 저장된 스키마(JSON 문자열 또는 객체)를 그릴 수 있는 스키마로 바꾼다.
 * simple/outcome/chip은 TableComponent가 없다 → 순위 입력 / 승무패 입력 / 바이인·칩 세기 입력이 그려진다.
 * 모르는 type이거나 깨진 JSON이면 null (점수판 없음).
 */
export const parseSchema = (raw) => {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Object.hasOwn(TABLES, parsed.type)) return { ...parsed, TableComponent: TABLES[parsed.type] };
  } catch { /* 깨진 스키마는 없는 것으로 취급 */ }
  return null;
};

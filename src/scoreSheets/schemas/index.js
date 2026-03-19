import { catanSchema, CatanTable } from './catan.jsx';
import { sevenWondersSchema } from './sevenWonders';
import { azulSchema } from './azul';
import { cascadiaSchema } from './cascadia';
import { duelSchema, DuelTable } from './duel.jsx';
import { unoSchema, UnoTable } from './uno.jsx';
import { rummikubSchema, RummikubTable } from './rummikub.jsx';
import FlatTable from '../tables/FlatTable';
import SectionedTable from '../tables/SectionedTable';

export const SCORE_SCHEMAS = {
  1: { ...catanSchema,        TableComponent: CatanTable },
  2: { ...sevenWondersSchema, TableComponent: FlatTable },
  3: { ...cascadiaSchema,     TableComponent: SectionedTable },
  4: { ...azulSchema,         TableComponent: FlatTable },
  6: { ...duelSchema,         TableComponent: DuelTable },
  7: { ...unoSchema,          TableComponent: UnoTable },
  8: { ...rummikubSchema,     TableComponent: RummikubTable },
};

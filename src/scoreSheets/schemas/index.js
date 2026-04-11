import { catanSchema, CatanTable } from './catan.jsx';
import { sevenWondersSchema } from './sevenWonders';
import { azulSchema } from './azul';
import { cascadiaSchema } from './cascadia';
import { duelSchema, DuelTable } from './duel.jsx';
import { unoSchema, UnoTable } from './uno.jsx';
import { rummikubSchema, RummikubTable } from './rummikub.jsx';
import { splendorSchema } from './splendor';
import { skeweredMasterSchema } from './skeweredMaster';
import { takenovoSchema } from './takenoko';
import { littleTownsSchema } from './littleTowns';
import { diceThroneSchema, DiceThroneTable } from './dicethrone.jsx';
import { splendorDuelSchema, SplendorDuelTable } from './splendorduel.jsx';
import { unmatchedSchema, UnmatchedTable } from './unmatched.jsx';
import FlatTable from '../tables/FlatTable';
import SectionedTable from '../tables/SectionedTable';

export const SCORE_SCHEMAS = {
  1:  { ...catanSchema,          TableComponent: CatanTable },
  2:  { ...sevenWondersSchema,   TableComponent: FlatTable },
  3:  { ...cascadiaSchema,       TableComponent: SectionedTable },
  4:  { ...azulSchema,           TableComponent: FlatTable },
  6:  { ...duelSchema,           TableComponent: DuelTable },
  8:  { ...unoSchema,            TableComponent: UnoTable },
  9:  { ...rummikubSchema,       TableComponent: RummikubTable },
  10: { ...splendorSchema,        TableComponent: FlatTable },
  11: { ...skeweredMasterSchema,  TableComponent: FlatTable },
  12: { ...takenovoSchema,        TableComponent: FlatTable },
  13: { ...littleTownsSchema,     TableComponent: FlatTable },
  14: { ...diceThroneSchema,      TableComponent: DiceThroneTable },
  15: { ...splendorDuelSchema,    TableComponent: SplendorDuelTable },
  16: { ...unmatchedSchema,       TableComponent: UnmatchedTable },
};

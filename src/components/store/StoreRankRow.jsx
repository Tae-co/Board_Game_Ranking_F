import { V } from '../../utils/cssUtils';
import DiceAvatar from '../shared/DiceAvatar';
import { num } from './fmt';

/** 순위 한 줄 (시안 2·2b·3): 순위 · 동그라미 · 이름(+나) · 판수(선택) · 점수. 1~3위는 강조색 */
const StoreRankRow = ({ item, first, meLabel, showGames = false, gamesLabel }) => (
  <div style={{
    height: 52, display: 'flex', alignItems: 'center', gap: '12px',
    borderTop: first ? 0 : `1px solid ${V('--th-border')}`,
    ...(item.me && showGames && { margin: '0 -16px', padding: '0 16px', backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.1)` }),
  }}>
    <span style={{ width: 24, fontSize: '15px', fontWeight: 700, color: item.rank <= 3 ? V('--th-primary') : V('--th-text-sub') }}>{item.rank}</span>
    <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>
      <span style={{ width: 32, height: 32, borderRadius: 999, flexShrink: 0, backgroundColor: item.me ? `rgba(${V('--th-primary-rgb')}, 0.3)` : V('--th-bg-deep'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DiceAvatar size={32} color={item.me ? V('--th-primary') : V('--th-text-sub')} /></span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nickname}</span>
      {item.me && (
        <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: 700, padding: '1px 8px', borderRadius: 999, backgroundColor: V('--th-primary'), color: '#fff' }}>{meLabel}</span>
      )}
    </span>
    {showGames && <span style={{ width: 40, textAlign: 'right', fontSize: '13px', color: V('--th-text-sub') }}>{gamesLabel}</span>}
    <span style={{ width: showGames ? 52 : 'auto', textAlign: 'right', fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{num(item.score)}</span>
  </div>
);

export default StoreRankRow;

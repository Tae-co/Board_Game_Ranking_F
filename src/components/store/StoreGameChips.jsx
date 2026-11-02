import { V } from '../../utils/cssUtils';

/** 게임 칩 가로 줄 (시안 2 · 2b) */
const StoreGameChips = ({ games, selectedId, onSelect, edge = 20 }) => (
  <div style={{ display: 'flex', gap: '8px', marginRight: -edge, overflowX: 'auto', scrollbarWidth: 'none' }}>
    {games.map(g => {
      const on = g.storeRoomId === selectedId;
      return (
        <button key={g.storeRoomId} onClick={() => onSelect(g.storeRoomId)} style={{
          height: 34, padding: '0 14px', borderRadius: 999, flexShrink: 0, cursor: 'pointer',
          backgroundColor: on ? V('--th-primary') : V('--th-card'), color: on ? '#fff' : V('--th-text-sub'),
          border: `1px solid ${on ? V('--th-primary') : V('--th-border')}`, fontSize: '13px', fontWeight: 500,
        }}>{g.name}</button>
      );
    })}
  </div>
);

export default StoreGameChips;

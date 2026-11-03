import { useState } from 'react';
import { V } from '../../utils/cssUtils';
import StoreGameChips from './StoreGameChips';
import StoreRankRow from './StoreRankRow';
import { fmt } from './fmt';
import { emptyCard } from './storeStyles';

/** 게임별 매장 랭킹 (시안 2): 게임 칩 + Top 5 + 더보기(→ 2b). 기록이 없으면 빈 카드 */
const StoreGameRankings = ({ rankings, onMore, t }) => {
  const [selected, setSelected] = useState(rankings[0]?.storeRoomId);
  if (rankings.length === 0) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'rankingTitle')}</h2>
        <p style={emptyCard}>{t('store', 'noRankingYet')}</p>
      </section>
    );
  }
  const current = rankings.find(r => r.storeRoomId === selected) ?? rankings[0];
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'rankingTitle')}</h2>
      <StoreGameChips games={rankings} selectedId={current.storeRoomId} onSelect={setSelected} />
      <div style={{ backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '4px 16px' }}>
        {current.top.map((item, i) => (
          <StoreRankRow key={item.memberId} item={item} first={i === 0} meLabel={t('store', 'meBadge')} />
        ))}
      </div>
      {onMore && (
        <button onClick={() => onMore(current.storeRoomId)} style={{
          height: 48, borderRadius: '14px', cursor: 'pointer', backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
          color: V('--th-primary'), fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          {t('store', 'moreWithPlayers')}
          <span style={{ fontWeight: 500, color: V('--th-text-sub') }}>{fmt(t('store', 'playersSuffix'), { n: current.playerCount })}</span>
        </button>
      )}
    </section>
  );
};

export default StoreGameRankings;

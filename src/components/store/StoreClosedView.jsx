import { useState } from 'react';
import { V } from '../../utils/cssUtils';
import MemberDiceAvatar from '../shared/MemberDiceAvatar';
import { ShopIcon } from './StoreIcons';
import GameImageFallback from '../shared/GameImageFallback';
import StoreGameChips from './StoreGameChips';
import { fmt, num } from './fmt';
import { card, sectionTitle } from './storeStyles';
import { storeTitle } from '../../constants/store';

const Tile = ({ label, value }) => (
  <div style={{ ...card, borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
    <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>{label}</span>
    <span style={{ fontSize: '18px', fontWeight: 700, color: V('--th-text') }}>{value}</span>
  </div>
);

/**
 * 운영 끝난 매장 (시안 2h). 안내 · 내 기록(멤버만) · 마지막 게임별 랭킹 · "게임방이 모두 닫혔어요".
 * 사진은 흑백으로. 위쪽 막대는 매장 홈 것을 그대로 쓴다.
 */
const StoreClosedView = ({ home, lang, t }) => {
  const { store, rankings, closedRecord, season } = home;
  const [selected, setSelected] = useState(rankings[0]?.storeRoomId);
  const current = rankings.find(r => r.storeRoomId === selected) ?? rankings[0];
  const closedDate = store.closedAt ? new Date(store.closedAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US') : '';

  return (
    <>
      <div style={{ height: 140, backgroundColor: V('--th-bg-deep'), filter: 'grayscale(1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {store.imageUrl
          ? <img src={store.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <GameImageFallback size={56} />}
      </div>
      <main style={{ boxSizing: 'border-box', padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section style={{
          backgroundColor: V('--th-bg-deep'), border: `1px solid ${V('--th-border')}`, borderRadius: '16px', padding: '16px',
          display: 'flex', gap: '12px', alignItems: 'flex-start', color: V('--th-text-sub'),
        }}>
          <ShopIcon />
          <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'closedTitle2h')}</span>
            <span style={{ fontSize: '14px', lineHeight: 1.5 }}>{fmt(t('store', 'closedDesc2h'), { date: closedDate })}</span>
          </span>
        </section>

        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: V('--th-text') }}>{storeTitle(store)}</h1>

        {closedRecord && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={sectionTitle}>{t('store', 'myRecord')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
              <Tile label={t('store', 'lastRank')} value={closedRecord.lastRank ? fmt(t('store', 'myRankValue'), { rank: closedRecord.lastRank }) : '—'} />
              <Tile label={t('store', 'reportMatches')} value={fmt(t('store', 'gamesCount'), { n: closedRecord.games })} />
              <Tile label={t('store', 'visitsLabel')} value={fmt(t('store', 'daysCount'), { n: closedRecord.visits })} />
            </div>
          </section>
        )}

        {current && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={sectionTitle}>{t('store', 'lastRankings')}</h2>
              {season && <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{fmt(t('store', 'seasonBasis'), { name: season.name })}</span>}
            </div>
            <StoreGameChips games={rankings} selectedId={current.storeRoomId} onSelect={setSelected} />
            <div style={{ ...card, padding: '4px 16px' }}>
              {current.top.map((item, i) => (
                <div key={item.memberId} style={{ height: 52, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i === 0 ? 'none' : `1px solid ${V('--th-border')}` }}>
                  <span style={{ width: 24, fontSize: '15px', fontWeight: 700, color: i < 3 ? V('--th-primary') : V('--th-text-sub') }}>{item.rank}</span>
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 500, color: V('--th-text') }}>
                    <MemberDiceAvatar memberId={item.memberId} nickname={item.nickname} size={32} />
                    {item.nickname}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{num(item.score)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={sectionTitle}>{t('store', 'storeGames')}</h2>
          <div style={{ height: 64, borderRadius: '16px', border: `1px dashed ${V('--th-border')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: V('--th-text-sub') }}>
            {t('store', 'roomsAllClosed')}
          </div>
        </section>
      </main>
    </>
  );
};

export default StoreClosedView;

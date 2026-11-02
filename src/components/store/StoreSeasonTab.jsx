import { useQuery } from '@tanstack/react-query';
import { getStoreRoomSeasons } from '../../api/services/stores';
import { V } from '../../utils/cssUtils';
import { fmt, num } from './fmt';
import { card } from './storeStyles';
import { Skeleton } from '../Skeleton';

/** 2026-11-01 → 11/1 */
const shortDate = (iso) => {
  if (!iso) return '';
  const [, m, d] = iso.split('-').map(Number);
  return `${m}/${d}`;
};

const Tile = ({ label, value, accent }) => (
  <div style={{ backgroundColor: V('--th-bg'), borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
    <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>{label}</span>
    <span style={{ fontSize: '20px', fontWeight: 700, color: accent ? V('--th-primary') : V('--th-text') }}>{value}</span>
  </div>
);

/** 매장 게임방 시즌 탭 (시안 3l): 이번 시즌 카드 · 내 이번 시즌 · 지난 시즌 (이 게임 상위 3명 + 내 순위) */
const StoreSeasonTab = ({ storeId, roomId, t }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['store', 'room', Number(roomId), 'seasons'],
    queryFn: () => getStoreRoomSeasons(storeId, roomId),
  });
  if (isLoading || !data) return <Skeleton height={160} radius={20} />;
  const cur = data.current;
  const total = cur ? Math.max(1, (new Date(cur.endDate) - new Date(cur.startDate)) / 86400000 + 1) : 1;
  const progress = cur ? Math.min(100, Math.max(0, ((total - cur.daysLeft) / total) * 100)) : 0;
  const mine = data.mine;

  return (
    <>
      {cur && (
        <section style={{ backgroundColor: V('--th-primary'), borderRadius: '20px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' }}>{t('store', 'seasonOngoing')}</span>
            <span style={{ fontSize: '13px', opacity: 0.9 }}>{shortDate(cur.startDate)} – {shortDate(cur.endDate)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700 }}>{cur.name}</span>
            <span style={{ fontSize: '14px', opacity: 0.9 }}>{fmt(t('store', 'seasonLeftPlayers'), { n: cur.daysLeft, p: data.players })}</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', borderRadius: 999, backgroundColor: '#fff' }} />
          </div>
        </section>
      )}

      <section style={{ ...card, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'mySeason')}</h2>
        {mine ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
              <Tile label={t('store', 'colRank')} value={fmt(t('store', 'myRankValue'), { rank: mine.rank })} accent />
              <Tile label={t('store', 'colScore')} value={num(mine.score)} />
              <Tile label={t('store', 'colGames')} value={mine.games} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{t('store', 'placeDist')}</span>
              <span style={{ fontSize: '14px', fontWeight: 500, color: V('--th-text') }}>
                {fmt(t('store', 'placeDistValue'), { a: mine.first, b: mine.second, c: mine.third, d: mine.fourthPlus })}
                {mine.avgPlacement != null && (
                  <span style={{ color: V('--th-text-sub') }}> {fmt(t('store', 'avgPlace'), { n: mine.avgPlacement })}</span>
                )}
              </span>
            </div>
          </>
        ) : (
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('store', 'noMySeason')}</span>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'pastSeasons')}</h2>
        {data.past.length === 0 && <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('store', 'noPastSeason')}</span>}
        {data.past.map(s => (
          <div key={s.id} style={{ ...card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{s.name}</span>
                <span style={{ fontSize: '12px', color: V('--th-text-sub') }}>
                  {fmt(t('store', 'pastMeta'), { period: `${shortDate(s.startDate)} – ${shortDate(s.endDate)}`, n: s.players })}
                </span>
              </span>
              <span style={{ flexShrink: 0, fontSize: '13px', fontWeight: 700, padding: '4px 10px', borderRadius: 999, backgroundColor: `rgba(${V('--th-primary-rgb')}, 0.12)`, color: V('--th-primary') }}>
                {s.myRank ? fmt(t('store', 'myRankPill'), { n: s.myRank }) : t('store', 'myRankNone')}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {s.top.map(item => (
                <span key={item.rank} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: item.rank === 1 ? V('--th-primary') : V('--th-text'), fontWeight: item.rank === 1 ? 700 : 400 }}>
                    {fmt(t('store', 'placeName'), { n: item.rank, name: item.nickname ?? t('store', 'leftMember') })}
                  </span>
                  <span style={{ color: V('--th-text-sub') }}>{num(item.score)}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
};

export default StoreSeasonTab;

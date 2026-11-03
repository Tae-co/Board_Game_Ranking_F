import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStoreGames, getStoreHome, getStoreRanking } from '../api/services/stores';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import StoreGameChips from '../components/store/StoreGameChips';
import StoreRankRow from '../components/store/StoreRankRow';
import StoreBottomBar from '../components/store/StoreBottomBar';
import { InfoButton, InfoPopup } from '../components/store/StorePopup';
import { fmt, num } from '../components/store/fmt';
import { card } from '../components/store/storeStyles';
import { Skeleton } from '../components/Skeleton';

/** 게임별 매장 랭킹 전체 (시안 2b · 구경 2e). 상위 20명 + 내 순위 카드(구경엔 없음), 게임 칩으로 바꾼다 */
const StoreRanking = () => {
  const { storeId, roomId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [info, setInfo] = useState(false);

  const { data: home } = useQuery({ queryKey: ['store', Number(storeId), 'home'], queryFn: () => getStoreHome(storeId), staleTime: 30_000 });
  const { data: games = [] } = useQuery({ queryKey: ['store', Number(storeId), 'games'], queryFn: () => getStoreGames(storeId) });
  const { data: ranking, isLoading } = useQuery({
    queryKey: ['store', 'room', Number(roomId), 'ranking'],
    queryFn: () => getStoreRanking(storeId, roomId),
  });
  const storeName = home ? [home.store.name, home.store.branch].filter(Boolean).join(' ') : '';
  const me = ranking?.me;
  // 2e 구경: 내 순위 없음, 아래 QR 안내
  const isVisitor = home && (home.viewer.role === 'VISITOR' || home.viewer.role === 'STAFF_OTHER');
  const season = ranking?.season;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar
        title={t('store', 'rankingPageTitle')}
        onBack={() => navigate(-1)}
        backLabel={t('common', 'back')}
        right={<InfoButton onClick={() => setInfo(true)} label={t('store', 'infoAria')} />}
      />
      <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: isVisitor ? '20px 20px 110px' : '20px 20px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>
            {season
              ? fmt(t('store', 'rankingMetaSeason'), { store: storeName, season: season.name, n: ranking?.playerCount ?? 0 })
              : fmt(t('store', 'rankingMeta'), { store: storeName, n: ranking?.playerCount ?? 0 })}
          </span>
          {season && <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{fmt(t('store', 'seasonDaysLeft'), { n: season.daysLeft })}</span>}
        </section>
        <StoreGameChips
          games={games}
          selectedId={Number(roomId)}
          onSelect={(id) => navigate(`/store/${storeId}/rooms/${id}/ranking`, { replace: true })}
        />
        {me && !isVisitor && (
          <section style={{ backgroundColor: V('--th-primary'), color: '#fff', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '12px', opacity: 0.85 }}>{t('store', 'myRank')}</span>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>
                {fmt(t('store', 'myRankValue'), { rank: me.rank })}{' '}
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{fmt(t('store', 'ofPlayers'), { n: ranking.playerCount })}</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>{num(me.score)}</span>
              <span style={{ fontSize: '12px', opacity: 0.85 }}>{fmt(t('store', 'gamesCount'), { n: me.games })}</span>
            </div>
          </section>
        )}
        {isLoading ? <Skeleton height={300} radius={20} /> : ranking.items.length === 0 ? (
          <p style={{ margin: 0, padding: '24px 0', textAlign: 'center', fontSize: '13px', color: V('--th-text-sub') }}>{t('store', 'noRankingYet')}</p>
        ) : (
          <section style={{ ...card, padding: '4px 16px' }}>
            <div style={{ height: 36, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: V('--th-text-sub') }}>
              <span style={{ width: 24 }}>{t('store', 'colRank')}</span>
              <span style={{ flex: 1 }}>{t('store', 'colMember')}</span>
              <span style={{ width: 40, textAlign: 'right' }}>{t('store', 'colGames')}</span>
              <span style={{ width: 52, textAlign: 'right' }}>{t('store', 'colScore')}</span>
            </div>
            {ranking.items.map(item => (
              <StoreRankRow key={item.memberId} item={item} meLabel={t('store', 'meBadge')} showGames
                gamesLabel={fmt(t('store', 'gamesCount'), { n: item.games })} />
            ))}
          </section>
        )}
      </main>
      {isVisitor && <StoreBottomBar title={t('store', 'qrBar')} />}
      {info && <InfoPopup title={t('store', 'infoTitle')} text={t('store', isVisitor ? 'rankingInfoVisitor' : 'rankingInfo')} okLabel={t('store', 'infoOk')} onClose={() => setInfo(false)} />}
    </div>
  );
};

export default StoreRanking;

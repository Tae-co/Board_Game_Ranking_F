import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStoreEvents, getStoreHome } from '../api/services/stores';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import StoreEventCards from '../components/contest/StoreEventCards';
import { useGoBack } from '../hooks/useGoBack';

/** 매장 이벤트 전체 (매장 홈 이벤트 더보기). 대회(진행 중 → 모집 중 → 끝남) + 매장 이벤트(진행 중·예정)를 세로로 */
const StoreEvents = () => {
  const { storeId } = useParams();
  const goBack = useGoBack();
  const { t, lang } = useLanguage();

  // 대회 카드 버튼(참가 신청·STAFF 진행 등)이 역할을 본다 — 매장 홈과 같은 캐시
  const { data: home } = useQuery({ queryKey: ['store', Number(storeId), 'home'], queryFn: () => getStoreHome(storeId), staleTime: 30_000 });
  const { data } = useQuery({ queryKey: ['store', Number(storeId), 'events'], queryFn: () => getStoreEvents(storeId) });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar title={t('contest', 'eventsTitle')} onBack={() => goBack(`/store/${storeId}`)} backLabel={t('common', 'back')} />
      <main style={{ maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data && home && (
          <StoreEventCards storeId={storeId} contests={data.contests} events={data.events} role={home.viewer.role} t={t} lang={lang} vertical />
        )}
      </main>
    </div>
  );
};

export default StoreEvents;

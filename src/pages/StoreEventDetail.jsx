import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStoreEvents } from '../api/services/stores';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import { fmt } from '../components/store/fmt';
import { card, page, sectionTitle } from '../components/store/storeStyles';
import { PILL, pill, shortDate } from '../components/contest/contestUtils';
import { useGoBack } from '../hooks/useGoBack';

const bodyText = { margin: 0, fontSize: '15px', lineHeight: 1.6, color: V('--th-text'), whiteSpace: 'pre-line' };

/** 매장 이벤트 자세히 보기 (카드의 자세히 보기). 사진 · 기간 · 혜택 · 사용 방법. 끝난 이벤트면 이벤트 목록으로 */
const StoreEventDetail = () => {
  const { storeId, eventId } = useParams();
  const goBack = useGoBack();
  const { t } = useLanguage();

  // 이벤트 목록(진행 중·예정)과 같은 캐시
  const { data } = useQuery({ queryKey: ['store', Number(storeId), 'events'], queryFn: () => getStoreEvents(storeId) });
  const e = data?.events.find(x => x.id === Number(eventId));

  if (data && !e) return <Navigate to={`/store/${storeId}/events`} replace />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar title={t('contest', 'eventsTitle')} onBack={() => goBack(`/store/${storeId}/events`)} backLabel={t('common', 'back')} />
      {e && (
        <main style={{ ...page, padding: '20px 20px 40px', gap: '24px' }}>
          {e.imageUrl && (
            <img src={e.imageUrl} alt="" style={{ width: '100%', aspectRatio: '4 / 3', borderRadius: '20px', objectFit: 'cover' }} />
          )}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={pill(PILL.blue)}>{t('contest', 'badgeStoreEvent')}</span>
              {!e.active && <span style={pill(PILL.gray)}>{t('contest', 'badgeUpcoming')}</span>}
            </div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.01em', color: V('--th-text') }}>{e.title}</h1>
            <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>
              {fmt(t('contest', 'eventPeriod'), { from: shortDate(e.startsOn), to: shortDate(e.endsOn) })}
            </span>
          </section>
          {e.benefitText && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h2 style={sectionTitle}>{t('contest', 'eventBenefit')}</h2>
              <div style={{ ...card, padding: '18px' }}><p style={bodyText}>{e.benefitText}</p></div>
            </section>
          )}
          {e.howToUse && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h2 style={sectionTitle}>{t('contest', 'eventHowToUse')}</h2>
              <div style={{ ...card, padding: '18px' }}><p style={bodyText}>{e.howToUse}</p></div>
            </section>
          )}
        </main>
      )}
    </div>
  );
};

export default StoreEventDetail;

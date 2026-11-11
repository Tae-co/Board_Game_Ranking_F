import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoreEvents, getStoreHome, storeErrorCode, redeemStoreEventCoupon } from '../api/services/stores';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';
import StoreFixedBottom from '../components/store/StoreFixedBottom';
import { ConfirmDialog } from '../components/store/StorePopup';
import { fmt } from '../components/store/fmt';
import { card, page, primaryButton, sectionTitle } from '../components/store/storeStyles';
import { PILL, contestWhen, pill, shortDate } from '../components/contest/contestUtils';
import { useGoBack } from '../hooks/useGoBack';
import { useApiErrorMessage } from '../hooks/useApiErrorMessage';

const bodyText = { margin: 0, fontSize: '15px', lineHeight: 1.6, color: V('--th-text'), whiteSpace: 'pre-line' };

/**
 * 매장 이벤트 자세히 보기 (카드의 자세히 보기). 사진 · 기간 · 혜택 · 사용 방법. 끝난 이벤트면 이벤트 목록으로.
 * 1회용 쿠폰이면 하단에 사용 완료 (매장 멤버만, 기간 안에, 한 번만 — 서버 store_event_use가 막는다)
 */
const StoreEventDetail = () => {
  const { storeId, eventId } = useParams();
  const goBack = useGoBack();
  const queryClient = useQueryClient();
  const { t, lang } = useLanguage();
  const errorText = useApiErrorMessage();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // 이벤트 목록(진행 중·예정)·매장 홈과 같은 캐시. 홈은 역할(멤버만 쿠폰 사용)을 본다
  const eventsKey = ['store', Number(storeId), 'events'];
  const { data } = useQuery({ queryKey: eventsKey, queryFn: () => getStoreEvents(storeId) });
  const { data: home } = useQuery({ queryKey: ['store', Number(storeId), 'home'], queryFn: () => getStoreHome(storeId), staleTime: 30_000 });
  const e = data?.events.find(x => x.id === Number(eventId));

  if (data && !e) return <Navigate to={`/store/${storeId}/events`} replace />;

  const use = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await redeemStoreEventCoupon(storeId, eventId);
      queryClient.setQueryData(eventsKey, (old) => old && { ...old, events: old.events.map(x => (x.id === next.id ? next : x)) });
      setConfirming(false);
    } catch (err) {
      setConfirming(false);
      setError(storeErrorCode(err) ? errorText(err, t('contest', 'couponFailed')) : t('contest', 'couponFailed'));
      queryClient.invalidateQueries({ queryKey: eventsKey });
    } finally {
      setBusy(false);
    }
  };

  const role = home?.viewer.role;
  let bottom = null;
  if (e?.oneTime && role) {
    if (e.usedAt) {
      bottom = <button disabled style={primaryButton(false)}>{fmt(t('contest', 'couponUsedAt'), { when: contestWhen(e.usedAt, lang) })}</button>;
    } else if (role === 'STAFF' || role === 'STAFF_OTHER') {
      bottom = <button disabled style={primaryButton(false)}>{t('contest', 'couponStaff')}</button>;
    } else if (role !== 'MEMBER') {
      bottom = <button disabled style={primaryButton(false)}>{t('contest', 'couponMembersOnly')}</button>;
    } else if (!e.active) {
      bottom = <button disabled style={primaryButton(false)}>{fmt(t('contest', 'couponUpcoming'), { date: shortDate(e.startsOn) })}</button>;
    } else {
      bottom = <button onClick={() => setConfirming(true)} disabled={busy} style={primaryButton(!busy)}>{t('contest', 'couponUse')}</button>;
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar title={t('contest', 'eventsTitle')} onBack={() => goBack(`/store/${storeId}/events`)} backLabel={t('common', 'back')} />
      {e && (
        <main style={{ ...page, padding: bottom ? '20px 20px 120px' : '20px 20px 40px', gap: '24px' }}>
          {e.imageUrl && (
            <img src={e.imageUrl} alt="" style={{ width: '100%', aspectRatio: '4 / 3', borderRadius: '20px', objectFit: 'cover' }} />
          )}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={pill(PILL.blue)}>{t('contest', 'badgeStoreEvent')}</span>
              {e.oneTime && <span style={pill(e.usedAt ? PILL.gray : PILL.orange)}>{t('contest', e.usedAt ? 'badgeCouponUsed' : 'badgeCoupon')}</span>}
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
      {bottom && (
        <StoreFixedBottom>
          {error && <span role="status" style={{ textAlign: 'center', fontSize: '13px', color: '#B91C1C' }}>{error}</span>}
          {bottom}
        </StoreFixedBottom>
      )}
      {confirming && (
        <ConfirmDialog
          title={t('contest', 'couponConfirmTitle')}
          body={t('contest', 'couponConfirmBody')}
          cancelLabel={t('contest', 'cancel')}
          actionLabel={t('contest', 'couponConfirmAction')}
          onCancel={() => setConfirming(false)}
          onAction={use}
          danger={false}
          busy={busy}
        />
      )}
    </div>
  );
};

export default StoreEventDetail;

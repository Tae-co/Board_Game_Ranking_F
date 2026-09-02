import { useCallback, useEffect, useState } from 'react';
import { getSubscription, setSubscription } from '../utils/storage';
import { addMonths, BILLING, PLANS } from '../constants/subscription';

/**
 * 모임장 Pro 구독 상태. **결제 로직은 없다 — 로컬에만 저장하는 UI 프로토타입이다.**
 *
 * 실제 과금을 붙일 땐 이 훅의 내부만 서버 호출로 갈아끼우면 되도록,
 * 화면들은 여기서 나온 값(active/expiresAt/…)에만 의존하게 해뒀다.
 * 서버 강제 판정은 별도다 — 문서 A-4 참조.
 */
export const useSubscription = (communityId) => {
  const [subscription, setState] = useState(() => getSubscription(communityId));

  useEffect(() => {
    setState(getSubscription(communityId));
  }, [communityId]);

  const persist = useCallback((next) => {
    setSubscription(communityId, next);
    setState(next);
  }, [communityId]);

  const subscribe = useCallback((billing) => {
    persist({ billing, startedAt: new Date().toISOString(), canceledAt: null });
  }, [persist]);

  /** 해지해도 남은 기간은 살려둔다. 낸 돈만큼은 쓰게 하는 게 이 제품이 정한 원칙이다. */
  const cancel = useCallback(() => {
    if (!subscription) return;
    persist({ ...subscription, canceledAt: new Date().toISOString() });
  }, [persist, subscription]);

  const resume = useCallback(() => {
    if (!subscription) return;
    persist({ ...subscription, canceledAt: null });
  }, [persist, subscription]);

  const plan = subscription ? PLANS[subscription.billing] ?? PLANS[BILLING.MONTHLY] : null;
  const expiresAt = subscription ? addMonths(subscription.startedAt, plan.months) : null;

  return {
    subscription,
    plan,
    /** 해지 예약이어도 만료 전이면 계속 이용 중이다 */
    active: !!subscription && expiresAt > new Date(),
    canceled: !!subscription?.canceledAt,
    /** 해지 안 했으면 다음 결제일, 했으면 이용 종료일 — 날짜는 같다 */
    expiresAt,
    subscribe,
    cancel,
    resume,
  };
};

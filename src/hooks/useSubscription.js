import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelSubscription,
  getMySubscription,
  resumeSubscription,
  subscribeMock,
} from '../api/services/subscriptions';
import { getAuthUserId } from '../auth/storage';
import { BILLING, PLANS } from '../constants/subscription';

/**
 * 모임장 Pro 구독 상태. **결제 로직은 없다 — 서버가 만료 시각 플래그만 들고 있다.**
 *
 * **계정 단위다.** 로그인한 사람의 구독 하나가 그 사람의 모든 커뮤니티에 적용된다.
 * 그래서 인자를 받지 않는다 — 어느 커뮤니티에서 부르든 같은 답이 나와야 한다.
 *
 * 서버가 소유자다. localStorage에 두면 커뮤니티에 들어오려는 사람의 앱이
 * 운영자의 구독을 알 수 없어서 인원 한도를 join에서 막을 수 없다.
 *
 * 실제 결제를 붙일 땐 백엔드 subscribe가 영수증 검증을 하도록 바꾸면 되고,
 * 이 훅과 화면들은 그대로 둔다.
 */
export const useSubscription = () => {
  const queryClient = useQueryClient();
  const userId = getAuthUserId();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', userId],
    queryFn: getMySubscription,
    enabled: !!userId,
    staleTime: 1000 * 30,
  });

  // 구독이 바뀌면 게이트 판정이 달라진다. 로비·설정이 즉시 따라오도록 캐시를 비운다.
  const refresh = useCallback(
    (next) => {
      queryClient.setQueryData(['subscription', userId], next);
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
    },
    [queryClient, userId],
  );

  const subscribe = useCallback(
    async (billing) => refresh(await subscribeMock(billing)),
    [refresh],
  );

  /** 해지해도 남은 기간은 살려둔다. 낸 돈만큼은 쓰게 하는 게 이 제품이 정한 원칙이다. */
  const cancel = useCallback(async () => refresh(await cancelSubscription()), [refresh]);
  const resume = useCallback(async () => refresh(await resumeSubscription()), [refresh]);

  const billing = data?.billing ?? BILLING.MONTHLY;

  return {
    subscription: data?.active || data?.proUntil ? data : null,
    plan: PLANS[billing] ?? PLANS[BILLING.MONTHLY],
    /** 서버 판정. 해지 예약이어도 만료 전이면 true다. */
    active: !!data?.active,
    canceled: !!data?.canceled,
    /** 해지 안 했으면 다음 결제일, 했으면 이용 종료일 — 날짜는 같다 */
    expiresAt: data?.proUntil ? new Date(data.proUntil) : null,
    isLoading,
    subscribe,
    cancel,
    resume,
  };
};

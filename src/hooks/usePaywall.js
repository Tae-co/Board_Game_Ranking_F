import { useCallback, useState } from 'react';
import { recordGateEvent } from '../api/services/gates';
import { GATE_ACTION } from '../constants/gates';
import { getAuthUserId } from '../auth/storage';
import { getSelectedCommunity } from '../utils/storage';

/**
 * 페이크 도어 페이월. 결제 로직은 없고, 어느 게이트에서 막혔는지만 기록한다.
 *
 * openPaywall(gateKey)를 부르면 그 즉시 HIT을 남기고 시트를 연다.
 * 이벤트 전송은 기다리지 않는다 — 측정이 사용자 흐름을 막으면 안 된다.
 */
export const usePaywall = () => {
  const [activeGate, setActiveGate] = useState(null);

  const track = useCallback((gateKey, action) => {
    if (!getAuthUserId()) return;
    recordGateEvent({
      gateKey,
      action,
      communityId: getSelectedCommunity()?.communityId ?? null,
    });
  }, []);

  const openPaywall = useCallback((gateKey) => {
    track(gateKey, GATE_ACTION.HIT);
    setActiveGate(gateKey);
  }, [track]);

  const closePaywall = useCallback(() => setActiveGate(null), []);

  return { activeGate, openPaywall, closePaywall, track };
};

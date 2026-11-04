import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Client } from '@stomp/stompjs';
import { getAccessToken } from '../api/axios';
import { getCurrentParty } from '../api/services/stores';
import { getWsBrokerUrl } from './usePresence';

export const CURRENT_PARTY_KEY = ['store', 'party', 'current'];

/** 내 오늘의 그룹 (없으면 null). 주사위 버튼·그룹 화면·게임방이 같이 쓴다 */
export const useCurrentParty = (enabled = true) => useQuery({
  queryKey: CURRENT_PARTY_KEY,
  queryFn: getCurrentParty,
  enabled,
  staleTime: 1000 * 10,
  // 소켓이 끊겨도 30초 안에 따라잡는다 (재연결·백그라운드 복귀 땐 포커스 refetch)
  refetchInterval: 1000 * 30,
});

/**
 * 그룹이 바뀌었다는 서버 신호(/topic/store-party/{id})를 받아 그룹·판 쿼리를 다시 받는다.
 * 앱에 한 번만 둔다 (PartyBubble). 신호엔 상태가 없고 상태는 GET으로 받는다 (plan-store-impl §3.4)
 */
export const usePartyRealtime = (partyId) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!partyId) return;
    const client = new Client({
      brokerURL: getWsBrokerUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      beforeConnect: () => {
        client.connectHeaders = { Authorization: `Bearer ${getAccessToken() || ''}` };
      },
      onConnect: () => {
        // 연결·재연결 직후에도 한 번 받아서 끊긴 동안 놓친 변경을 따라잡는다
        queryClient.invalidateQueries({ queryKey: CURRENT_PARTY_KEY });
        queryClient.invalidateQueries({ queryKey: ['store', 'match'] });
        client.subscribe(`/topic/store-party/${partyId}`, () => {
          queryClient.invalidateQueries({ queryKey: CURRENT_PARTY_KEY });
          queryClient.invalidateQueries({ queryKey: ['store', 'match'] });
          queryClient.invalidateQueries({ queryKey: ['store', 'room'] });
          queryClient.invalidateQueries({ queryKey: ['store', 'contest'] });
        });
      },
    });
    client.activate();
    return () => { client.deactivate(); };
  }, [partyId, queryClient]);
};

/**
 * 기다리는 화면(3b·3·3n·3m)에 있으면 기록자가 판을 시작하는 순간 점수판으로 바꾼다 (plan-store §2.1 3번).
 * 다른 화면은 바뀌지 않고 주사위 버튼으로 들어간다. exceptMatchId = 지금 보고 있는 끝난 판(3n·3m)
 */
export const useAutoEnterMatch = (party, myId, navigate, exceptMatchId = null) => {
  const match = party?.currentMatch;
  const mine = !!match && match.participantIds.includes(Number(myId));
  useEffect(() => {
    if (mine && match.id !== exceptMatchId) navigate(`/store/match/${match.id}`, { replace: true });
  }, [mine, match?.id, exceptMatchId, navigate]);
};

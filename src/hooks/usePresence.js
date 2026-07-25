import { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import { getAccessToken } from '../api/axios';

const getWsBrokerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (apiUrl.startsWith('https://')) {
    return apiUrl.replace(/\/api.*$/, '/ws').replace('https://', 'wss://');
  }
  if (apiUrl.startsWith('http://')) {
    return apiUrl.replace(/\/api.*$/, '/ws').replace('http://', 'ws://');
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
};

export const usePresence = (memberId, roomId) => {
  const [onlineIds, setOnlineIds] = useState(new Set());

  useEffect(() => {
    if (!memberId || !roomId) return;

    const client = new Client({
      brokerURL: getWsBrokerUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // 매 연결/재연결마다 최신 액세스 토큰을 CONNECT 헤더로 전송 (#19).
      // 서버가 이 토큰에서 memberId를 도출하므로 body엔 더 이상 memberId를 싣지 않는다.
      beforeConnect: () => {
        client.connectHeaders = { Authorization: `Bearer ${getAccessToken() || ''}` };
      },
      onConnect: () => {
        client.subscribe(`/topic/room/${roomId}/presence`, (msg) => {
          setOnlineIds(new Set(JSON.parse(msg.body)));
        });
        client.publish({
          destination: '/app/presence/join',
          body: JSON.stringify({ roomId: String(roomId) }),
        });
      },
    });

    client.activate();
    return () => { client.deactivate(); };
  }, [memberId, roomId]);

  return onlineIds;
};

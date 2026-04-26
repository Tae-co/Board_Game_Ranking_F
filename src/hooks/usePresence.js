import { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const getWsUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  if (apiUrl.startsWith('http')) {
    return apiUrl.replace(/\/api.*$/, '/ws');
  }
  return '/ws';
};

export const usePresence = (memberId, roomId) => {
  const [onlineIds, setOnlineIds] = useState(new Set());

  useEffect(() => {
    if (!memberId || !roomId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(getWsUrl()),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/room/${roomId}/presence`, (msg) => {
          setOnlineIds(new Set(JSON.parse(msg.body)));
        });
        client.publish({
          destination: '/app/presence/join',
          body: JSON.stringify({ memberId: Number(memberId), roomId: String(roomId) }),
        });
      },
    });

    client.activate();
    return () => { client.deactivate(); };
  }, [memberId, roomId]);

  return onlineIds;
};

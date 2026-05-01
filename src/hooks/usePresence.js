import { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';

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

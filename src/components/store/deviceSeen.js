import { fmt } from './fmt';

// 기기는 30초마다 부르고 서버는 1분에 한 번 기록한다 — 이보다 오래면 '[N]분 전 마지막 연결'(주황)
const JUST_MS = 3 * 60 * 1000;

/** 매장 기기 목록(2l·6g)의 마지막 접속 문구. stale이면 주황 */
export const deviceSeen = (device, t) => {
  if (!device.connected) return { text: t('store', 'deviceWaiting'), stale: true };
  if (!device.lastSeenAt) return { text: t('store', 'deviceSeenJust'), stale: false };
  const ago = Date.now() - new Date(device.lastSeenAt).getTime();
  if (ago < JUST_MS) return { text: t('store', 'deviceSeenJust'), stale: false };
  const min = Math.floor(ago / 60000);
  if (min < 60) return { text: fmt(t('store', 'deviceSeenMin'), { n: min }), stale: true };
  const hour = Math.floor(min / 60);
  if (hour < 24) return { text: fmt(t('store', 'deviceSeenHour'), { n: hour }), stale: true };
  return { text: fmt(t('store', 'deviceSeenDay'), { n: Math.floor(hour / 24) }), stale: true };
};

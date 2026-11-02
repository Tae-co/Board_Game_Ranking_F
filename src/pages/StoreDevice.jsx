import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { getDeviceDisplay, getDevicePairCode, getDevicePairStatus, storeErrorCode } from '../api/services/stores';
import { setAccessToken } from '../api/axios';
import { clearAuthSession } from '../auth/storage';
import { clearDeviceToken, getDeviceToken, setDeviceToken } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';
import DeviceStage from '../components/storeDevice/DeviceStage';
import DevicePair from '../components/storeDevice/DevicePair';
import { TV_H, TV_W, TvJustFinished, TvLeaders, TvQr, TvTop10 } from '../components/storeDevice/TvScreens';
import { TABLE_H, TABLE_W, TableOffline, TableQr, TvOffline } from '../components/storeDevice/TableScreens';
import { clock, minSec } from '../components/storeDevice/deviceTheme';

const PAIR_POLL_MS = 3000;
const PAIR_RETRY_MS = 5000;
const DISPLAY_POLL_MS = 30_000;
const JUST_FINISHED_MS = 8000;
// 정각에 새 QR을 받을 때 서버 시계가 아직 정각 전일 수 있어 조금 늦게 부른다
const QR_REFRESH_DELAY_MS = 1500;
// QR이 만료되고 이만큼 지나도 새 QR을 못 받았으면 끊김으로 본다 (낡은 QR을 계속 띄우지 않는다, §6.6)
const QR_STALE_GRACE_MS = 10_000;

/** 서버 시각 기준 지금. serverNow를 받을 때마다 기기 시계와의 차이를 맞춘다 */
const useServerClock = () => {
  const offsetRef = useRef(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + offsetRef.current), 1000);
    return () => clearInterval(timer);
  }, []);
  const sync = useCallback((serverNowIso) => {
    offsetRef.current = new Date(serverNowIso).getTime() - Date.now();
    setNow(Date.now() + offsetRef.current);
  }, []);
  return [now, sync];
};

/** 4j: 숫자 받기 → STAFF가 입력할 때까지 폴링 → 토큰을 받으면 사람 로그인을 지우고 기기 모드로 */
const PairScreen = ({ onPaired, t }) => {
  const navigate = useNavigate();
  const [pair, setPair] = useState(null); // { code, nonce, expiresAtMs }
  const [now, sync] = useServerClock();
  const fetchingRef = useRef(false);

  const [attempt, setAttempt] = useState(0);

  const fetchCode = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const data = await getDevicePairCode();
      sync(data.serverNow);
      setPair({ code: data.code, nonce: data.nonce, expiresAtMs: new Date(data.expiresAt).getTime() });
    } catch {
      setPair(null);
      setTimeout(() => setAttempt(a => a + 1), PAIR_RETRY_MS);
    } finally {
      fetchingRef.current = false;
    }
  }, [sync]);

  useEffect(() => { fetchCode(); }, [fetchCode, attempt]);

  // 10분 지나면 새 숫자
  useEffect(() => {
    if (pair && now >= pair.expiresAtMs) fetchCode();
  }, [pair, now, fetchCode]);

  useEffect(() => {
    if (!pair) return undefined;
    let stopped = false;
    const timer = setInterval(async () => {
      try {
        const res = await getDevicePairStatus(pair.nonce);
        if (stopped) return;
        if (res.status === 'CLAIMED' && res.deviceToken) {
          stopped = true;
          onPaired(res.deviceToken);
        } else if (res.status === 'EXPIRED') {
          fetchCode();
        }
      } catch {
        // 네트워크가 잠깐 끊긴 건 다음 폴링에서 다시
      }
    }, PAIR_POLL_MS);
    return () => { stopped = true; clearInterval(timer); };
  }, [pair, onPaired, fetchCode]);

  const leftMs = pair ? Math.max(0, pair.expiresAtMs - now) : 0;
  return (
    <DeviceStage width={TABLE_W} height={TABLE_H}>
      <DevicePair code={pair?.code} leftMs={leftMs} leftText={minSec(leftMs, t)} onLogin={() => navigate('/login')} t={t} />
    </DeviceStage>
  );
};

/** TV 돌아가는 순서 (6k). 띄울 내용이 없는 화면은 건너뛴다. 매장 이벤트·대회·시즌은 아직 내용이 없어 늘 건너뜀 */
const buildRotation = (display) => {
  const slides = [];
  for (const key of display.setting.order) {
    if (key === 'MVP' && (display.mvp?.gameLeaders?.length || display.mvp?.mostVisits)) slides.push({ key: 'MVP' });
    if (key === 'TOP10') display.top10.forEach(g => slides.push({ key: `TOP10-${g.boardGameId}`, game: g }));
    if (key === 'QR') slides.push({ key: 'QR' });
  }
  return slides.length ? slides : [{ key: 'QR' }];
};

/** 4·4f 기기 화면. 30초마다 다시 받고, QR은 만료 시각(서버 기준)에 맞춰 새로 받는다 */
const DisplayScreen = ({ token, onRevoked, t }) => {
  const [display, setDisplay] = useState(null);
  const [failed, setFailed] = useState(false);
  const [lastOkAt, setLastOkAt] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [now, sync] = useServerClock();
  const [slideIndex, setSlideIndex] = useState(0);
  const [justQueue, setJustQueue] = useState([]);
  const shownMatchIds = useRef(new Set());

  const load = useCallback(async () => {
    try {
      const data = await getDeviceDisplay(token);
      sync(data.serverNow);
      setDisplay(data);
      setFailed(false);
      setOnline(true);
      setLastOkAt(new Date());
      const fresh = (data.justFinished ?? []).filter(m => !shownMatchIds.current.has(m.matchId));
      if (fresh.length) {
        fresh.forEach(m => shownMatchIds.current.add(m.matchId));
        setJustQueue(q => [...q, ...fresh]);
      }
    } catch (e) {
      if (storeErrorCode(e) === 'DEVICE_TOKEN_INVALID') {
        onRevoked();
        return;
      }
      setFailed(true);
    }
  }, [token, sync, onRevoked]);

  // 30초 재조회는 끊긴 화면에서도 계속 돈다 — 연결이 돌아오면 저절로 복구
  useEffect(() => {
    load();
    const timer = setInterval(load, DISPLAY_POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const on = () => { setOnline(true); load(); };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [load]);

  // 정각에 새 QR
  const qrExpiresAtMs = display ? new Date(display.qr.expiresAt).getTime() : null;
  useEffect(() => {
    if (!qrExpiresAtMs) return undefined;
    const wait = Math.max(0, qrExpiresAtMs - now) + QR_REFRESH_DELAY_MS;
    const timer = setTimeout(load, wait);
    return () => clearTimeout(timer);
    // now는 매초 바뀌므로 만료 시각이 바뀔 때만 다시 잡는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrExpiresAtMs, load]);

  const isTv = display?.device.kind === 'TV';
  const rotation = useMemo(() => (isTv ? buildRotation(display) : []), [isTv, display]);
  const intervalMs = (display?.setting?.intervalSec ?? 10) * 1000;
  const showingJust = justQueue.length > 0;

  // 화면 넘기기. 방금 끝난 경기가 끼어 있는 동안은 멈춘다
  useEffect(() => {
    if (!isTv || showingJust) return undefined;
    const timer = setInterval(() => setSlideIndex(i => i + 1), intervalMs);
    return () => clearInterval(timer);
  }, [isTv, showingJust, intervalMs]);

  useEffect(() => {
    if (!showingJust) return undefined;
    const timer = setTimeout(() => setJustQueue(q => q.slice(1)), JUST_FINISHED_MS);
    return () => clearTimeout(timer);
  }, [showingJust, justQueue]);

  if (!display) {
    if (!failed) return <DeviceStage width={TV_W} height={TV_H} />;
    return (
      <DeviceStage width={TV_W} height={TV_H}>
        <TvOffline lastText={null} onRetry={load} t={t} />
      </DeviceStage>
    );
  }

  const remainingMs = Math.max(0, qrExpiresAtMs - now);
  const qrStale = now - qrExpiresAtMs > QR_STALE_GRACE_MS;
  const offline = failed || !online || qrStale;
  const lastText = lastOkAt ? clock(lastOkAt) : null;

  if (!isTv) {
    return (
      <DeviceStage width={TABLE_W} height={TABLE_H}>
        {offline
          ? <TableOffline store={display.store} deviceName={display.device.name} lastText={lastText} onRetry={load} t={t} />
          : <TableQr store={display.store} deviceName={display.device.name} url={display.qr.url} remainingMs={remainingMs} t={t} />}
      </DeviceStage>
    );
  }

  let screen;
  if (offline) {
    screen = <TvOffline lastText={lastText} onRetry={load} t={t} />;
  } else if (showingJust) {
    screen = <TvJustFinished match={justQueue[0]} t={t} />;
  } else {
    const slide = rotation[slideIndex % rotation.length];
    if (slide.key === 'MVP') screen = <TvLeaders store={display.store} mvp={display.mvp} t={t} />;
    else if (slide.game) screen = <TvTop10 store={display.store} game={slide.game} t={t} />;
    else screen = <TvQr store={display.store} url={display.qr.url} remainingMs={remainingMs} t={t} />;
  }
  return <DeviceStage width={TV_W} height={TV_H}>{screen}</DeviceStage>;
};

/**
 * 매장 기기 모드 `/device` (plan-store §6.6, 시안 4j·4·4f·4c). 사람 로그인 없이 기기 토큰으로만 연다.
 * 토큰이 없으면 4j 숫자 화면, 있으면 TV(4 순서대로) / 테이블 기기(4f). 해제되면 4j로 돌아온다.
 * 기기 모드에선 화면이 꺼지지 않게 한다 (네이티브만).
 */
const StoreDevice = () => {
  const { t } = useLanguage();
  const [token, setToken] = useState(() => getDeviceToken());

  useEffect(() => {
    if (!token || !Capacitor.isNativePlatform()) return undefined;
    KeepAwake.keepAwake().catch(() => {});
    return () => { KeepAwake.allowSleep().catch(() => {}); };
  }, [token]);

  const handlePaired = useCallback((deviceToken) => {
    // 기기 모드로 들어가면 이 기기의 사람 로그인은 로그아웃 (§6.6)
    setAccessToken(null);
    clearAuthSession();
    setDeviceToken(deviceToken);
    setToken(deviceToken);
  }, []);

  const handleRevoked = useCallback(() => {
    // 기기 모드가 풀리면 앱 라우터로 돌아가므로 4j 경로에 서 있게 한다
    window.history.replaceState(null, '', '/device');
    clearDeviceToken();
    setToken(null);
  }, []);

  return token
    ? <DisplayScreen token={token} onRevoked={handleRevoked} t={t} />
    : <PairScreen onPaired={handlePaired} t={t} />;
};

export default StoreDevice;

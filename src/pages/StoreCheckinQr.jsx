import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { WifiOff } from 'lucide-react';
import { getCheckinQr, getStoreHome, storeErrorCode } from '../api/services/stores';
import { CHECKIN_QR_SLOT_MS, storeTitle } from '../constants/store';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import StoreTopBar from '../components/store/StoreTopBar';

// 만료 뒤 새 QR을 못 받았을 때 다시 묻는 간격. 서버 시계가 아직 정각 전이면 같은 QR이 오므로 계속 두드리지 않는다
const RETRY_MS = 3000;

/**
 * 2m STAFF 폰 체크인 QR. 매장 TV가 꺼졌을 때 같은 QR을 띄운다.
 * 기기 시계가 틀려도 정각에 맞춰 바뀌도록 serverNow와 로컬 시각의 차이를 보정한다.
 * 이 매장 STAFF가 아니면 서버가 403 → 매장 홈으로.
 */
const StoreCheckinQr = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  // 매장 이름만 쓴다. 매장 홈에서 들어오면 캐시에 이미 있다
  const { data: home } = useQuery({
    queryKey: ['store', Number(storeId), 'home'],
    queryFn: () => getStoreHome(storeId),
    staleTime: 1000 * 30,
  });

  const [qr, setQr] = useState(null);           // { url, expiresAtMs }
  const [now, setNow] = useState(Date.now());   // 서버 기준 지금
  const offsetRef = useRef(0);
  const fetchingRef = useRef(false);
  const lastTryRef = useRef(0);

  const fetchQr = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    lastTryRef.current = Date.now();
    try {
      const data = await getCheckinQr(storeId);
      offsetRef.current = new Date(data.serverNow).getTime() - Date.now();
      setQr({ url: data.url, expiresAtMs: new Date(data.expiresAt).getTime() });
      setNow(Date.now() + offsetRef.current);
    } catch (e) {
      const code = storeErrorCode(e);
      if (code === 'NOT_STAFF_OF_STORE' || code === 'STORE_CLOSED' || code === 'STORE_NOT_FOUND') {
        navigate(`/store/${storeId}`, { replace: true });
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [storeId, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + offsetRef.current), 1000);
    return () => clearInterval(timer);
  }, []);

  const expired = qr && now >= qr.expiresAtMs;

  // 처음 받을 때, 그리고 만료된 뒤(또는 처음부터 못 받았으면) RETRY_MS마다 받는다
  useEffect(() => {
    if ((!qr || expired) && Date.now() - lastTryRef.current >= RETRY_MS) fetchQr();
  }, [qr, expired, now, fetchQr]);

  const remainingMs = qr ? Math.max(0, qr.expiresAtMs - now) : 0;
  const minutesLeft = Math.max(1, Math.ceil(remainingMs / 60000));
  // 만료 직후 몇 초는 새 QR을 받는 중으로 보고, 그래도 못 받으면 QR을 지운다 (찍어도 1f가 뜨니까)
  const offline = expired && now - qr.expiresAtMs > RETRY_MS * 2;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <StoreTopBar
        title={t('store', 'checkinQrTitle')}
        onBack={() => navigate(`/store/${storeId}`, { replace: true })}
        backLabel={t('common', 'back')}
      />

      <main style={{
        maxWidth: 430, margin: '0 auto', boxSizing: 'border-box', padding: '28px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: V('--th-text-sub') }}>
            {t('store', 'staffBadge')}{home ? ` · ${storeTitle(home.store)}` : ''}
          </span>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: V('--th-text') }}>{t('store', 'checkinQrDesc')}</h1>
        </div>

        <div style={{
          width: 312, height: 312, boxSizing: 'border-box', padding: 16, borderRadius: '24px',
          backgroundColor: '#fff', border: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {qr && !offline ? (
            <QRCodeSVG value={qr.url} size={280} bgColor="#ffffff" fgColor="#111827" style={{ opacity: expired ? 0.15 : 1 }} />
          ) : offline ? (
            <WifiOff size={48} color="#9ca3af" />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: `4px solid ${V('--th-primary')}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          )}
        </div>

        {qr && !expired && (
          <div style={{ width: 312, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ height: 8, borderRadius: 999, backgroundColor: V('--th-border'), overflow: 'hidden' }}>
              <div style={{
                height: '100%', backgroundColor: V('--th-primary'),
                width: `${Math.min(100, (remainingMs / CHECKIN_QR_SLOT_MS) * 100)}%`,
                transition: 'width 1s linear',
              }} />
            </div>
            <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>
              {t('store', 'checkinQrRemaining').replace('{m}', minutesLeft)}
            </span>
          </div>
        )}
        {expired && !offline && (
          <span style={{ fontSize: '14px', color: V('--th-text-sub') }}>{t('store', 'checkinQrRefreshing')}</span>
        )}
        {offline && (
          <div style={{ maxWidth: 312 }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text'), margin: '0 0 6px' }}>{t('store', 'checkinQrOffline')}</p>
            <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.5 }}>{t('store', 'checkinQrOfflineDesc')}</p>
          </div>
        )}

        <span style={{
          fontSize: '13px', lineHeight: 1.55, color: V('--th-text-sub'), textAlign: 'left',
          backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '12px', padding: '12px 14px',
        }}>
          {t('store', 'checkinQrNote')}
        </span>
      </main>
    </div>
  );
};

export default StoreCheckinQr;

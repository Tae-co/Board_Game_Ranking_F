import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, WifiOff } from 'lucide-react';
import { getCheckinQr, storeErrorCode } from '../api/services/stores';
import { CHECKIN_QR_SLOT_MS } from '../constants/store';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';

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
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  // 만료 직후 몇 초는 새 QR을 받는 중으로 보고, 그래도 못 받으면 QR을 지운다 (찍어도 1f가 뜨니까)
  const offline = expired && now - qr.expiresAtMs > RETRY_MS * 2;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid ${V('--th-border')}` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 20px' }}>
          <button
            onClick={() => navigate(`/store/${storeId}`, { replace: true })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: V('--th-primary'), display: 'flex' }}
          >
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontSize: '17px', fontWeight: '700', color: V('--th-text') }}>{t('store', 'checkinQrTitle')}</span>
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text'), margin: '0 0 24px', textAlign: 'center' }}>
          {t('store', 'checkinQrDesc')}
        </p>

        <div style={{
          width: 280, height: 280, borderRadius: '24px', backgroundColor: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', marginBottom: '24px',
        }}>
          {qr && !offline ? (
            <QRCodeSVG value={qr.url} size={240} bgColor="#ffffff" fgColor="#1a1a2e" style={{ opacity: expired ? 0.15 : 1 }} />
          ) : offline ? (
            <WifiOff size={48} color="#9ca3af" />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: `4px solid ${V('--th-primary')}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          )}
        </div>

        {qr && !expired && (
          <div style={{ width: 280 }}>
            <div style={{ height: 6, borderRadius: 3, backgroundColor: V('--th-border'), overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{
                height: '100%', borderRadius: 3, backgroundColor: V('--th-primary'),
                width: `${Math.min(100, (remainingMs / CHECKIN_QR_SLOT_MS) * 100)}%`,
                transition: 'width 1s linear',
              }} />
            </div>
            <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: 0, textAlign: 'center' }}>
              {t('store', 'checkinQrRemaining').replace('{m}', minutes).replace('{s}', String(seconds).padStart(2, '0'))}
            </p>
          </div>
        )}
        {expired && !offline && (
          <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: 0 }}>{t('store', 'checkinQrRefreshing')}</p>
        )}
        {offline && (
          <div style={{ textAlign: 'center', maxWidth: 280 }}>
            <p style={{ fontSize: '15px', fontWeight: '700', color: V('--th-text'), margin: '0 0 6px' }}>{t('store', 'checkinQrOffline')}</p>
            <p style={{ fontSize: '12px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.5 }}>{t('store', 'checkinQrOfflineDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreCheckinQr;

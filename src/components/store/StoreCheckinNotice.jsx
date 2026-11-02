import { CheckCircle2, ScanLine } from 'lucide-react';
import { REGION_TIMEZONE } from '../../constants/regions';
import { V } from '../../utils/cssUtils';

// 시각은 UTC로 오고, 표시는 매장 지역 시간으로 한다
const formatStoreTime = (iso, region, lang) => {
  try {
    return new Date(iso).toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US', {
      hour: '2-digit', minute: '2-digit', timeZone: REGION_TIMEZONE[region],
    });
  } catch {
    return '';
  }
};

/** 멤버의 체크인 상태. 만료(마지막 QR·기록 후 3시간)면 QR을 다시 찍으라고 안내한다 */
const StoreCheckinNotice = ({ checkin, region, lang, t }) => {
  if (checkin?.active) {
    return (
      <p style={{ fontSize: '12px', fontWeight: '600', color: '#16a34a', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <CheckCircle2 size={14} />
        {t('store', 'checkinActive').replace('{time}', formatStoreTime(checkin.expiresAt, region, lang))}
      </p>
    );
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '14px 16px', borderRadius: '14px', marginBottom: '20px',
      backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
    }}>
      <ScanLine size={20} color={V('--th-primary')} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <p style={{ fontSize: '14px', fontWeight: '700', color: V('--th-text'), margin: '0 0 3px' }}>{t('store', 'checkinExpiredTitle')}</p>
        <p style={{ fontSize: '12px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.5 }}>{t('store', 'checkinExpiredDesc')}</p>
      </div>
    </div>
  );
};

export default StoreCheckinNotice;

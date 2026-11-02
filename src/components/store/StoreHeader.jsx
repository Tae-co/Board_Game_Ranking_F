import { useState } from 'react';
import { Share } from '@capacitor/share';
import { Clock, MapPin, Phone, Share2, Users } from 'lucide-react';
import StoreThumb from './StoreThumb';
import { storeShareUrl, storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';

const InfoLine = ({ icon, children }) => {
  const Icon = icon;
  return (
  <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
    <Icon size={14} style={{ flexShrink: 0 }} />
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
  </p>
  );
};

/** 매장 홈 위쪽 매장 정보 + 공유 버튼(이름 줄 끝). 공유 링크엔 토큰이 없다 — 열면 구경이고 체크인은 안 된다 */
const StoreHeader = ({ store, memberCount, t }) => {
  const [copied, setCopied] = useState(false);
  const title = storeTitle(store);

  // InviteFriends.shareLink와 같은 규칙: 공유 시트가 없으면 클립보드로
  const handleShare = async () => {
    const url = storeShareUrl(store.id);
    const text = `${t('store', 'shareText').replace('{name}', title)}\n${url}`;
    let canShare = false;
    try { canShare = (await Share.canShare()).value; } catch { canShare = false; }
    if (canShare) {
      await Share.share({ title, text }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(t('store', 'shareUnavailable'));
    }
  };

  return (
    <div style={{
      borderRadius: '20px', padding: '18px',
      backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
        <StoreThumb store={store} size={64} radius={16} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '20px', fontWeight: '800', color: V('--th-text'), margin: '0 0 4px', lineHeight: 1.3 }}>
            {store.name}
          </p>
          {store.branch && (
            <p style={{ fontSize: '13px', fontWeight: '600', color: V('--th-text-sub'), margin: 0 }}>{store.branch}</p>
          )}
        </div>
        <button
          onClick={handleShare}
          aria-label={t('store', 'share')}
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '12px', fontWeight: '600', color: V('--th-text'),
            backgroundColor: V('--th-bg'), border: `1px solid ${V('--th-border')}`,
            borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
          }}
        >
          <Share2 size={13} />
          {copied ? t('store', 'linkCopied') : t('store', 'share')}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <InfoLine icon={MapPin}>{store.address}</InfoLine>
        <InfoLine icon={Clock}>{t('store', 'hours').replace('{open}', store.openTime).replace('{close}', store.closeTime)}</InfoLine>
        {store.phone && <InfoLine icon={Phone}>{store.phone}</InfoLine>}
        <InfoLine icon={Users}>{t('store', 'memberCount').replace('{n}', memberCount)}</InfoLine>
      </div>
    </div>
  );
};

export default StoreHeader;

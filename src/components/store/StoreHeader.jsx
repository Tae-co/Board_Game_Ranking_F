import { useState } from 'react';
import { Share } from '@capacitor/share';
import StorageImage from '../StorageImage';
import GameImageFallback from '../shared/GameImageFallback';
import { storeShareUrl, storeTitle } from '../../constants/store';
import { V } from '../../utils/cssUtils';
import { ShareIcon } from './StoreIcons';

const subStyle = { fontSize: '14px', color: V('--th-text-sub') };

/** 매장 홈 위쪽 대표 사진 (전체 폭 180px). 사진이 없으면 주사위 로고 */
export const StorePhoto = ({ store }) => (
  <div style={{ height: 180, flexShrink: 0, backgroundColor: V('--th-bg-deep'), overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {store?.imageUrl ? (
      <StorageImage src={store.imageUrl} alt={store.name} decoding="async"
        transform={{ width: 860, height: 360, quality: 75 }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    ) : (
      <GameImageFallback size={72} />
    )}
  </div>
);

/**
 * 매장 이름 + 공유 버튼, 아래로 (주소) · 영업시간 · "게임방 N개 · 멤버 N명". 주소는 구경(2d)에서만 보인다.
 * 공유 링크엔 토큰이 없다 — 열면 구경이고 체크인은 안 된다
 */
const StoreHeader = ({ store, memberCount, gameCount, showAddress, t }) => {
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
    <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.01em', color: V('--th-text') }}>{title}</h1>
        <button
          onClick={handleShare}
          aria-label={t('store', 'share')}
          style={{
            width: 44, height: 44, flexShrink: 0, marginRight: -10, border: 'none', borderRadius: 999,
            background: 'transparent', cursor: 'pointer', color: V('--th-text'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ShareIcon />
        </button>
      </div>
      {copied && <span style={{ ...subStyle, color: V('--th-primary'), fontWeight: 700 }}>{t('store', 'linkCopied')}</span>}
      {showAddress && <span style={subStyle}>{store.address}</span>}
      <span style={subStyle}>{t('store', 'hours').replace('{open}', store.openTime).replace('{close}', store.closeTime)}</span>
      <span style={subStyle}>
        {t('store', 'roomsAndMembers').replace('{rooms}', gameCount).replace('{members}', memberCount)}
      </span>
    </section>
  );
};

export default StoreHeader;

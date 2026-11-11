import { Users, Copy, CheckCheck } from 'lucide-react';
import StorageImage from '../StorageImage';

const coverStyle = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' };

/** 커뮤니티 로비 맨 위 사진 카드. 오른쪽 아래 초대 코드를 누르면 QR, 아이콘을 누르면 복사. */
const CommunityHero = ({ community, inviteCode, codeCopied, onShowQr, onCopy, t }) => (
  <div style={{
    borderRadius: '20px',
    marginBottom: '24px',
    position: 'relative',
    overflow: 'hidden',
    height: '200px',
    backgroundColor: '#2a1f6e',
    boxShadow: '0 4px 20px rgba(107,92,231,0.25)',
  }}>
    {community?.imageUrl ? (
      <StorageImage
        src={community.imageUrl}
        alt={community.name}
        loading="eager"
        decoding="async"
        transform={{ width: 780, height: 400, quality: 72 }}
        style={coverStyle}
      />
    ) : (
      // 사진 없이 만든 모임은 앱 로고(주사위)를 기본 사진으로 쓴다
      <img src="/logo.png" alt={community?.name} style={coverStyle} />
    )}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
    }} />
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '16px 20px',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    }}>
      <div>
        {/* 모임 이름은 헤더에 이미 있고, 카드 위에 두면 사진(대개 로고)을 가린다 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Users style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.8)' }} />
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
            {t('lobby', 'membersCount').replace('{n}', community?.memberCount ?? 0)}
          </span>
        </div>
      </div>
      {inviteCode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(6px)',
          borderRadius: '10px',
          padding: '6px 10px 6px 10px',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          <button
            onClick={onShowQr}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: '0.08em' }}>{t('lobby', 'codeLabel')}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em' }}>
              {inviteCode}
            </span>
          </button>
          <button
            onClick={onCopy}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0 2px 4px', display: 'flex', alignItems: 'center' }}
          >
            {codeCopied
              ? <CheckCheck size={14} color="#22c55e" />
              : <Copy size={14} color="rgba(255,255,255,0.7)" />
            }
          </button>
        </div>
      )}
    </div>
  </div>
);

export default CommunityHero;

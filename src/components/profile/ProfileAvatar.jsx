import { useRef, useState } from 'react';
import { Camera, Pencil } from 'lucide-react';
import { V } from '../../utils/cssUtils';

const menuButton = {
  display: 'flex', alignItems: 'center', gap: 10,
  width: '100%', padding: '13px 16px', border: 'none', background: 'none',
  cursor: 'pointer', fontSize: 14, fontWeight: 600,
};

/**
 * 프로필 사진 동그라미. 사진·카메라 버튼을 누르면 [사진 변경 / 기본으로] 메뉴가 열린다.
 * 오른쪽 아래 연필은 닉네임 바꾸기 토글.
 */
const ProfileAvatar = ({ nickname, profileImage, isUploading, onPhotoSelect, onResetPhoto, onToggleNicknameEdit, t }) => {
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);
  const toggleMenu = () => setShowMenu(v => !v);

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={toggleMenu}
        style={{
          width: 84, height: 84, borderRadius: '50%',
          backgroundColor: 'var(--th-primary)',
          border: '3px solid var(--th-primary)',
          boxShadow: '0 0 0 3px color-mix(in srgb, var(--th-primary) 20%, transparent)',
          overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt="profile"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 34 }}>
            {(nickname[0] || '?').toUpperCase()}
          </span>
        )}
        {isUploading && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        )}
      </div>

      {/* Camera button */}
      <button
        onClick={toggleMenu}
        style={{
          position: 'absolute', bottom: 0, left: 0,
          width: 26, height: 26, borderRadius: '50%',
          backgroundColor: '#fff', border: '2px solid var(--th-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}
      >
        <Camera size={12} color="var(--th-primary)" />
      </button>

      {/* Photo action menu */}
      {showMenu && (
        <>
          <div
            onClick={() => setShowMenu(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          />
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            marginTop: 10, zIndex: 101,
            backgroundColor: V('--th-card'), borderRadius: 14,
            border: `1px solid var(--th-border)`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            overflow: 'hidden', minWidth: 160,
          }}>
            <button
              onClick={() => { setShowMenu(false); fileInputRef.current?.click(); }}
              style={{ ...menuButton, color: V('--th-text'), borderBottom: `1px solid var(--th-border)` }}
            >
              <Camera size={15} color={V('--th-primary')} />
              {t('profile', 'changePhoto')}
            </button>
            {profileImage && (
              <button
                onClick={() => { setShowMenu(false); onResetPhoto(); }}
                style={{ ...menuButton, color: '#dc2626' }}
              >
                <span style={{ fontSize: 15 }}>↩</span>
                {t('profile', 'resetPhoto')}
              </button>
            )}
          </div>
        </>
      )}

      {/* Nickname edit button */}
      <button
        onClick={onToggleNicknameEdit}
        style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 26, height: 26, borderRadius: '50%',
          backgroundColor: 'var(--th-primary)', border: '2px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Pencil size={12} color="#fff" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onPhotoSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ProfileAvatar;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StorageImage from './StorageImage';
import { getNickname, AUTH_CHANGED_EVENT } from '../auth/storage';
import { getProfileImage } from '../utils/storage';

const NavAvatar = ({ size = 38, fontSize = 15 }) => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(() => getNickname() || '?');
  const [profileImage, setProfileImage] = useState(getProfileImage);

  useEffect(() => {
    const onAuthChanged = () => setNickname(getNickname() || '?');
    const onImageUpdated = () => setProfileImage(getProfileImage());
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    window.addEventListener('profileImageUpdated', onImageUpdated);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
      window.removeEventListener('profileImageUpdated', onImageUpdated);
    };
  }, []);

  return (
    <div
      onClick={() => navigate('/profile')}
      style={{
        width: size, height: size, borderRadius: '50%',
        backgroundColor: 'var(--th-primary)',
        border: 'none', cursor: 'pointer', flexShrink: 0,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(123,108,246,0.3)',
      }}
    >
      {profileImage ? (
        <StorageImage
          src={profileImage}
          alt="profile"
          loading="lazy"
          decoding="async"
          transform={{ width: size * 2, height: size * 2, quality: 70 }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span style={{ color: '#fff', fontWeight: 700, fontSize }}>
          {nickname[0].toUpperCase()}
        </span>
      )}
    </div>
  );
};

export default NavAvatar;

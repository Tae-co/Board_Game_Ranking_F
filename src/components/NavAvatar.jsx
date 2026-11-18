import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StorageImage from './StorageImage';
import { getProfileImage } from '../utils/storage';
import { getAuthUserId } from '../auth/storage';
import { getAvatarColorById } from '../utils/avatarUtils';
import DiceAvatar from './shared/DiceAvatar';
import { usePractice } from '../practice/usePractice';
import { practiceRing } from './practice/practiceRing';

const NavAvatar = ({ size = 38 }) => {
  const navigate = useNavigate();
  // 연습의 명예의 전당 단계: 마지막으로 내 사진을 눌러 프로필로 간다
  const practice = usePractice();
  const practiceTarget = practice.at('hallOfFame');
  const [profileImage, setProfileImage] = useState(getProfileImage);

  useEffect(() => {
    const onImageUpdated = () => setProfileImage(getProfileImage());
    window.addEventListener('profileImageUpdated', onImageUpdated);
    return () => {
      window.removeEventListener('profileImageUpdated', onImageUpdated);
    };
  }, []);

  return (
    <div
      onClick={practice.block(() => { practice.advance('hallOfFame', 'profile'); navigate('/profile'); }, 'hallOfFame')}
      style={{
        width: size, height: size, borderRadius: '50%',
        backgroundColor: getAvatarColorById(getAuthUserId()),
        border: 'none', cursor: 'pointer', flexShrink: 0,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(123,108,246,0.3)',
        ...practiceRing(practiceTarget, { pulse: true }),
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
        <DiceAvatar size={size} />
      )}
    </div>
  );
};

export default NavAvatar;

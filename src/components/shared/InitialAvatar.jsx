import { useState } from 'react';
import StorageImage from '../StorageImage';
import DiceAvatar from './DiceAvatar';

const InitialAvatar = ({ nickname, profileImage, size = 36, color = 'var(--th-primary)' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = profileImage && !imgFailed;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden',
    }}>
      {showImg
        ? <StorageImage src={profileImage} alt={nickname} loading="lazy" decoding="async" transform={{ width: size * 2, height: size * 2, quality: 70 }} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <DiceAvatar size={size} />
      }
    </div>
  );
};

export default InitialAvatar;

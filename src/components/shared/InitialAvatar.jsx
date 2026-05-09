import { useState } from 'react';
import StorageImage from '../StorageImage';

const InitialAvatar = ({ nickname, profileImage, size = 36, color = 'var(--th-primary)', fontSize = 14 }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = profileImage && !imgFailed;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize, flexShrink: 0, overflow: 'hidden',
    }}>
      {showImg
        ? <StorageImage src={profileImage} alt={nickname} loading="lazy" decoding="async" transform={{ width: size * 2, height: size * 2, quality: 70 }} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : (nickname || '?')[0].toUpperCase()
      }
    </div>
  );
};

export default InitialAvatar;

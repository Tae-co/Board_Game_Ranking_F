import { useNavigate } from 'react-router-dom';

const NavAvatar = ({ size = 38, fontSize = 15 }) => {
  const navigate = useNavigate();
  const nickname = localStorage.getItem('nickname') || '?';
  const profileImage = localStorage.getItem('profileImage');

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
        <img
          src={profileImage}
          alt="profile"
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

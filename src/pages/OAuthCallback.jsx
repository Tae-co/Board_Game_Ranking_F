import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAccessToken } from '../api/axios';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const nickname = searchParams.get('nickname');
    const role = searchParams.get('role');
    const refreshToken = searchParams.get('refreshToken');

    if (token && userId) {
      setAccessToken(token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('nickname', nickname || '');
      localStorage.setItem('role', role || 'USER');
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      navigate('/lobby', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF8F0' }}>
      <p style={{ color: '#8B7355' }}>로그인 처리 중...</p>
    </div>
  );
};

export default OAuthCallback;

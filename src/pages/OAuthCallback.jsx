import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAccessToken } from '../api/axios';
import { saveAuthSession } from '../auth/storage';

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
      saveAuthSession({
        userId,
        nickname,
        role,
        refreshToken,
      });
      navigate('/lobby', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--th-bg)' }}>
      <p style={{ color: 'var(--th-text-sub)' }}>로그인 처리 중...</p>
    </div>
  );
};

export default OAuthCallback;

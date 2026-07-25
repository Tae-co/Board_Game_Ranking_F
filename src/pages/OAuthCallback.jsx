import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAccessToken } from '../api/axios';
import { saveAuthSession } from '../auth/storage';
import { exchangeOAuthCode } from '../api/services/auth';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // 토큰은 URL에 없고, 1회용 code를 교환해 받는다 (#12).
    const code = searchParams.get('code');
    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    exchangeOAuthCode(code)
      .then(({ token, userId, nickname, role, refreshToken }) => {
        setAccessToken(token);
        saveAuthSession({ userId, nickname, role, refreshToken });
        const redirect = sessionStorage.getItem('pendingRedirect');
        if (redirect) sessionStorage.removeItem('pendingRedirect');
        navigate(redirect || '/community', { replace: true });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--th-bg)' }}>
      <p style={{ color: 'var(--th-text-sub)' }}>로그인 처리 중...</p>
    </div>
  );
};

export default OAuthCallback;

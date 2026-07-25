import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAccessToken } from '../api/axios';
import { saveAuthSession } from '../auth/storage';
import { exchangeOAuthCode } from '../api/services/auth';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // code는 1회용이라 교환은 딱 한 번만. StrictMode(dev)의 effect 이중 실행이나
  // 재렌더로 두 번 호출되면 두 번째가 이미 소비된 code로 실패해 로그인이 깨진다.
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;
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

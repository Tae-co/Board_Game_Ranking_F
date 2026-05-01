import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { setAccessToken } from '../api/axios';
import { saveAuthSession } from '../auth/storage';
import { useLanguage } from '../i18n/LanguageContext';

const V = (v) => `var(${v})`;

const isWebView = /FBAN|FBAV|Instagram|Twitter|Line|KAKAOTALK/i.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Android') && /wv\)/i.test(navigator.userAgent));

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const googleAuthUrl = `${import.meta.env.VITE_API_URL}/auth/google`;

  useEffect(() => {
    try {
      const key = import.meta.env.VITE_KAKAO_APP_KEY;
      if (window.Kakao && key && !window.Kakao.isInitialized()) {
        window.Kakao.init(key);
      }
    } catch (e) {
      console.warn('Kakao SDK init 실패:', e);
    }
  }, []);

  const saveLoginData = (data) => {
    setAccessToken(data.accessToken);
    saveAuthSession({
      userId: data.memberId,
      nickname: data.nickname,
      role: data.role,
      refreshToken: data.refreshToken,
    });
    const redirect = location.state?.redirectAfterLogin;
    navigate(redirect || '/lobby');
  };

  const handleKakaoLogin = () => {
    if (!window.Kakao?.isInitialized()) {
      alert(t('login', 'kakaoLoading'));
      return;
    }
    window.Kakao.Auth.login({
      throughTalk: false,
      success: async (authObj) => {
        try {
          const res = await api.post('/auth/kakao', { kakaoAccessToken: authObj.access_token });
          saveLoginData(res.data);
        } catch {
          alert(t('login', 'kakaoFailed'));
        }
      },
      fail: () => {
        alert(t('login', 'kakaoCanceled'));
      },
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: V('--th-bg'),
        padding: '48px 24px 32px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="52" height="52">
                <defs>
                  <linearGradient id="diceTop" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#90C4F9"/>
                    <stop offset="100%" stopColor="#7B6CF6"/>
                  </linearGradient>
                  <linearGradient id="diceLeft" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6B5CE7"/>
                    <stop offset="100%" stopColor="#4835B0"/>
                  </linearGradient>
                  <linearGradient id="diceRight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#9B8EFA"/>
                    <stop offset="100%" stopColor="#7060E0"/>
                  </linearGradient>
                </defs>
                {/* 윗면 */}
                <polygon points="50,10 84,29 50,48 16,29" fill="url(#diceTop)"/>
                {/* 왼쪽 면 */}
                <polygon points="16,29 50,48 50,88 16,69" fill="url(#diceLeft)"/>
                {/* 오른쪽 면 */}
                <polygon points="84,29 50,48 50,88 84,69" fill="url(#diceRight)"/>
                {/* 윗면 점 2개 (대각선) */}
                <circle cx="37" cy="24" r="3.8" fill="#fff" opacity="0.92"/>
                <circle cx="63" cy="38" r="3.8" fill="#fff" opacity="0.92"/>
                {/* 왼쪽 면 점 4개 */}
                <circle cx="27" cy="46" r="3.2" fill="#fff" opacity="0.85"/>
                <circle cx="39" cy="53" r="3.2" fill="#fff" opacity="0.85"/>
                <circle cx="27" cy="64" r="3.2" fill="#fff" opacity="0.85"/>
                <circle cx="39" cy="71" r="3.2" fill="#fff" opacity="0.85"/>
                {/* 오른쪽 면 점 3개 (대각선) */}
                <circle cx="72" cy="44" r="3.2" fill="#fff" opacity="0.85"/>
                <circle cx="64" cy="58" r="3.2" fill="#fff" opacity="0.85"/>
                <circle cx="72" cy="72" r="3.2" fill="#fff" opacity="0.85"/>
              </svg>
            </div>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: V('--th-text'), margin: '0 0 8px' }}>
            {t('login', 'title')}
          </h1>
          <p style={{ fontSize: '14px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.6 }}>
            {t('login', 'subtitle')}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isWebView && (
            <div style={{
              borderRadius: '10px', padding: '12px', fontSize: '12px',
              backgroundColor: '#FFF3CD', color: '#856404',
              border: '1px solid #FFECB5', lineHeight: 1.6,
            }}>
              ⚠️ {t('login', 'webViewWarning')}
            </div>
          )}

          {/* Google */}
          <button
            onClick={() => isWebView ? window.open(googleAuthUrl, '_blank') : (window.location.href = googleAuthUrl)}
            style={{
              width: '100%', padding: '15px', borderRadius: '50px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              backgroundColor: '#fff', color: '#1a1a1a',
              border: '1px solid #e0e0e0',
              fontSize: '15px', fontWeight: '500', cursor: 'pointer', transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            {t('login', 'googleLogin')}
          </button>

          {/* Kakao */}
          <button
            onClick={handleKakaoLogin}
            style={{
              width: '100%', padding: '15px', borderRadius: '50px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              backgroundColor: '#FEE500', color: '#191919', border: 'none',
              fontSize: '15px', fontWeight: '500', cursor: 'pointer', transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.896 1 7.455c0 2.282 1.518 4.283 3.808 5.42L3.93 16.1a.3.3 0 0 0 .437.326L8.49 13.88c.167.012.336.018.51.018 4.418 0 8-2.896 8-6.454C17 3.896 13.418 1 9 1Z" fill="#191919"/>
            </svg>
            {t('login', 'kakaoLogin')}
          </button>
        </div>

        {/* Admin link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => navigate('/admin-login')}
            style={{
              fontSize: '12px', color: V('--th-primary'),
              background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: '600', letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {t('login', 'adminLogin').toUpperCase()}
          </button>
        </div>

        {/* Terms notice */}
        <p style={{ fontSize: '10px', color: V('--th-text-sub'), marginTop: '32px', textAlign: 'center', lineHeight: 1.8, letterSpacing: '0.3px' }}>
          BY CONTINUING, YOU AGREE TO OUR{' '}
          <span style={{ fontWeight: '600' }}>TERMS</span>
          {' · '}
          <span style={{ fontWeight: '600' }}>PRIVACY</span>
        </p>
      </div>
    </div>
  );
};

export default Login;

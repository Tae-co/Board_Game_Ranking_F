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
  const featureCards = [
    {
      title: t('login', 'featureRoomsTitle'),
      description: t('login', 'featureRoomsDesc'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      title: t('login', 'featureTrackingTitle'),
      description: t('login', 'featureTrackingDesc'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 18.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M7.5 16V9.5M12 16V6.5M16.5 16v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      title: t('login', 'featureRankingTitle'),
      description: t('login', 'featureRankingDesc'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4.5 14.318 9.196l5.182.753-3.75 3.654.885 5.16L12 16.325 7.365 18.763l.885-5.16L4.5 9.949l5.182-.753L12 4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

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
      className="min-h-screen flex flex-col items-center"
      style={{ maxWidth: '430px', margin: '0 auto', backgroundColor: V('--th-bg'), padding: '40px 24px 32px' }}
    >
      {/* Dot pattern */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'radial-gradient(circle, var(--th-dot) 1px, transparent 1px)',
        backgroundSize: '24px 24px', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '360px' }}>
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="80" height="80">
              <rect x="0" y="0" width="240" height="240" rx="52" fill="var(--th-primary)"/>
              <g transform="translate(130, 52) rotate(20)">
                <rect x="0" y="0" width="86" height="86" rx="16" fill="var(--th-primary)" stroke="#fff" strokeWidth="7"/>
                <circle cx="22" cy="22" r="8" fill="#fff"/>
                <circle cx="64" cy="64" r="8" fill="#fff"/>
              </g>
              <g transform="translate(32, 102)">
                <rect x="0" y="0" width="96" height="96" rx="18" fill="#fff"/>
                <circle cx="26" cy="26" r="8.5" fill="var(--th-primary)"/>
                <circle cx="48" cy="48" r="8.5" fill="var(--th-primary)"/>
                <circle cx="70" cy="70" r="8.5" fill="var(--th-primary)"/>
              </g>
            </svg>
          </div>
          <h1 className="text-3xl mb-2" style={{ color: V('--th-text') }}>{t('login', 'title')}</h1>
          <p className="text-sm" style={{ color: V('--th-text-sub') }}>{t('login', 'subtitle')}</p>
        </div>

        {/* Card */}
        <div style={{ width: '100%', borderRadius: '16px', padding: '24px', border: `1px solid var(--th-border)`, backgroundColor: V('--th-card'), boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isWebView && (
              <div style={{ borderRadius: '12px', padding: '12px', fontSize: '12px', backgroundColor: '#FFF3CD', color: '#856404', border: '1px solid #FFECB5', lineHeight: 1.6 }}>
                ⚠️ {t('login', 'webViewWarning')}
              </div>
            )}

            {/* Google */}
            <button
              onClick={() => isWebView ? window.open(googleAuthUrl, '_blank') : (window.location.href = googleAuthUrl)}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                backgroundColor: V('--th-card'), color: V('--th-text'),
                border: `1px solid var(--th-border)`,
                fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s',
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
                width: '100%', padding: '14px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                backgroundColor: '#FEE500', color: '#191919', border: 'none',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s',
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
        </div>

        <section
          aria-label={t('login', 'introTitle')}
          style={{
            marginTop: '20px',
            borderRadius: '20px',
            padding: '20px',
            border: `1px solid color-mix(in srgb, var(--th-border) 70%, transparent)`,
            background: 'linear-gradient(180deg, color-mix(in srgb, var(--th-card) 92%, transparent), color-mix(in srgb, var(--th-primary) 10%, var(--th-card)))',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '999px',
              marginBottom: '12px',
              backgroundColor: 'color-mix(in srgb, var(--th-primary) 14%, transparent)',
              color: V('--th-primary'),
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '999px', backgroundColor: 'currentColor' }} />
            {t('login', 'introBadge')}
          </div>

          <h2 style={{ margin: 0, color: V('--th-text'), fontSize: '20px', lineHeight: 1.35 }}>
            {t('login', 'introTitle')}
          </h2>
          <p style={{ margin: '10px 0 0', color: V('--th-text-sub'), fontSize: '13px', lineHeight: 1.7 }}>
            {t('login', 'introDescription')}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
              gap: '10px',
              marginTop: '16px',
            }}
          >
            {featureCards.map((card) => (
              <div
                key={card.title}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '14px',
                  border: `1px solid color-mix(in srgb, var(--th-border) 65%, transparent)`,
                  backgroundColor: 'color-mix(in srgb, var(--th-card) 88%, transparent)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: 'color-mix(in srgb, var(--th-primary) 14%, transparent)',
                    color: V('--th-primary'),
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <div style={{ color: V('--th-text'), fontSize: '14px', fontWeight: 700 }}>
                    {card.title}
                  </div>
                  <div style={{ marginTop: '4px', color: V('--th-text-sub'), fontSize: '12px', lineHeight: 1.6 }}>
                    {card.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Admin link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/admin-login')}
            style={{ fontSize: '12px', color: V('--th-text-sub'), background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--th-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--th-text-sub)'}
          >
            {t('login', 'adminLogin')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { setAccessToken } from '../api/axios';
import { consumeSessionExpired, saveAuthSession } from '../auth/storage';
import { appleLogin } from '../api/services/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';

const isWebView = !Capacitor.isNativePlatform() && (
  /FBAN|FBAV|Instagram|Twitter|Line|KAKAOTALK/i.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Android') && /wv\)/i.test(navigator.userAgent))
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [sessionExpired] = useState(consumeSessionExpired);
  const googleAuthUrl = `${import.meta.env.VITE_API_URL}/auth/google`;
  const googleNativeAuthUrl = 'https://meeple-production.up.railway.app/api/auth/google/native/login';

  const saveLoginData = (data) => {
    setAccessToken(data.accessToken);
    saveAuthSession({
      userId: data.memberId,
      nickname: data.nickname,
      role: data.role,
      refreshToken: data.refreshToken,
    });
    const redirect = location.state?.redirectAfterLogin;
    navigate(redirect || '/community');
  };

  const handleAppleLogin = async () => {
    try {
      const result = await Capacitor.Plugins.AppleAuth.authorize();
      const { identityToken, givenName, familyName } = result;
      const nickname = [givenName, familyName].filter(Boolean).join(' ') || 'Apple User';
      const data = await appleLogin(identityToken, nickname);
      saveLoginData(data);
    } catch (e) {
      if (e?.message !== 'cancelled') {
        alert('Apple 로그인 오류: ' + (e?.message || ''));
      }
    }
  };

  const handleKakaoLogin = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Browser.open({ url: 'https://meeple-production.up.railway.app/api/auth/kakao/native/login' });
      } catch (e) {
        alert('카카오 로그인 오류: ' + e.message);
      }
      return;
    }
    const redirect = location.state?.redirectAfterLogin;
    if (redirect) sessionStorage.setItem('pendingRedirect', redirect);
    const returnTo = encodeURIComponent(window.location.origin);
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/kakao/login?returnTo=${returnTo}`;
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
              width: '100px', height: '100px', borderRadius: '28px',
              background: '#f3f1ff', border: '1px solid #e0d9ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(107, 92, 231, 0.12)',
            }}>
              <img src="/logo.png" width="68" height="68" style={{ objectFit: 'contain' }} alt="logo" />
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
          {sessionExpired && (
            <div style={{
              borderRadius: '10px', padding: '12px', fontSize: '12px',
              backgroundColor: '#FDECEA', color: '#B3261E',
              border: '1px solid #F7CFCB', lineHeight: 1.6,
            }}>
              {t('login', 'sessionExpired')}
            </div>
          )}

          {isWebView && (
            <div style={{
              borderRadius: '10px', padding: '12px', fontSize: '12px',
              backgroundColor: '#FFF3CD', color: '#856404',
              border: '1px solid #FFECB5', lineHeight: 1.6,
            }}>
              ⚠️ {t('login', 'webViewWarning')}
            </div>
          )}

          {/* Sign in with Apple - iOS 네이티브에서만 표시 */}
          {Capacitor.getPlatform() === 'ios' && (
            <button
              onClick={handleAppleLogin}
              style={{
                width: '100%', padding: '15px', borderRadius: '50px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                backgroundColor: '#000', color: '#fff', border: 'none',
                fontSize: '15px', fontWeight: '500', cursor: 'pointer', transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M12.26 0c.08 1.04-.3 2.06-.96 2.8-.66.74-1.66 1.3-2.66 1.22-.1-1 .34-2.04 1-2.76C10.3.52 11.36-.02 12.26 0zM15.9 12.38c-.44 1-.66 1.44-1.22 2.32-.8 1.22-1.92 2.74-3.32 2.76-1.24.02-1.56-.8-3.24-.78-1.68.02-2.04.82-3.28.78-1.4-.04-2.46-1.42-3.26-2.64C-.68 12.3-.28 8.7 1.6 6.78c1.32-1.36 3.38-1.66 4.86-.72.6.38 1.12.92 1.74.92.64 0 1.2-.56 2.16-.88 1.38-.46 3.02-.12 4.06 1.16-.62.42-2.52 1.86-2.24 4.28.26 2.18 1.96 3.3 3.72 3.84z" fill="#fff"/>
              </svg>
              {t('login', 'appleLogin') || 'Continue with Apple'}
            </button>
          )}

          {/* Google */}
          <button
            onClick={async () => {
              const redirect = location.state?.redirectAfterLogin;
              if (redirect) sessionStorage.setItem('pendingRedirect', redirect);
              if (Capacitor.isNativePlatform()) {
                try { await Browser.open({ url: googleNativeAuthUrl }); } catch (e) { alert('구글 로그인 오류: ' + e.message); }
                return;
              }
              const returnTo = encodeURIComponent(window.location.origin);
              const googleLoginUrl = `${import.meta.env.VITE_API_URL}/auth/google?returnTo=${returnTo}`;
              if (isWebView) { window.open(googleLoginUrl, '_blank'); } else { window.location.href = googleLoginUrl; }
            }}
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

        {/* Terms notice */}
        <p style={{ fontSize: '10px', color: V('--th-text-sub'), marginTop: '32px', textAlign: 'center', lineHeight: 1.8, letterSpacing: '0.3px' }}>
          BY CONTINUING, YOU AGREE TO OUR{' '}
          <span style={{ fontWeight: '600' }}>TERMS</span>
          {' · '}
          <span
            style={{ fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => Browser.open({ url: 'https://yadarank.com/privacy' })}
          >PRIVACY</span>
        </p>
      </div>
    </div>
  );
};

export default Login;

import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { setAccessToken, ensureToken } from './api/axios';
import { AUTH_CHANGED_EVENT, enforceSessionExpiry, getStoredAuth, saveAuthSession } from './auth/storage';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';

import './App.css';

const Login = lazy(() => import('./pages/Login'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Invite = lazy(() => import('./pages/Invite'));
const MatchForm = lazy(() => import('./pages/MatchForm'));
const ScoreSheet = lazy(() => import('./pages/ScoreSheet'));
const Ranking = lazy(() => import('./pages/Ranking'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const JoinByQR = lazy(() => import('./pages/JoinByQR'));
const CreateGroup = lazy(() => import('./pages/CreateGroup'));
const CommunityLobby = lazy(() => import('./pages/CommunityLobby'));
const CreateCommunity = lazy(() => import('./pages/CreateCommunity'));
const CommunitySettings = lazy(() => import('./pages/CommunitySettings'));
const CommunityMemberManage = lazy(() => import('./pages/CommunityMemberManage'));

const RouteFallback = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--th-bg)',
      color: 'var(--th-text-sub)',
      fontSize: '14px',
      fontWeight: 600,
    }}
  >
    Loading...
  </div>
);

function App() {
  const [authState, setAuthState] = useState(() => getStoredAuth());

  useEffect(() => {
    if (window.location.hostname.includes('pages.dev')) {
      const nextUrl = `https://app.yadarank.com${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(nextUrl);
      return;
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handler = CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.includes('oauth-callback')) return;
      await Browser.close();
      // 네이티브는 딥링크 토큰 방식 유지 (#12는 웹 전용, 백엔드 참고).
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get('token');
      const userId = urlObj.searchParams.get('userId');
      const nickname = urlObj.searchParams.get('nickname');
      const role = urlObj.searchParams.get('role');
      const refreshToken = urlObj.searchParams.get('refreshToken');
      if (token && userId) {
        setAccessToken(token);
        saveAuthSession({ userId, nickname, role, refreshToken });
        setAuthState(getStoredAuth());
      }
    });
    return () => { handler.then(h => h.remove()); };
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      setAuthState(getStoredAuth());
    };

    window.addEventListener(AUTH_CHANGED_EVENT, syncAuthState);
    window.addEventListener('storage', syncAuthState);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  const isAuthenticated = !!authState.userId;
  const isAdmin = authState.role === 'ADMIN';

  useEffect(() => {
    // Railway 서버 워밍업 - 콜드 스타트 방지
    axios.get(`${import.meta.env.VITE_API_URL}/health`).catch(() => {});
  }, []);

  useEffect(() => {
    // 앱 시작 시 저장된 refresh token으로 access token 복구 (Admin.jsx와 동일한 promise 공유)
    ensureToken();

    // 앱을 오래 켜둔 채 세션이 만료되는 경우 대비 - 복귀 시점에 확인해 바로 로그아웃
    const checkSession = () => {
      if (enforceSessionExpiry()) setAccessToken(null);
    };

    if (Capacitor.isNativePlatform()) {
      const handler = CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) checkSession();
      });
      return () => { handler.then(h => h.remove()); };
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkSession();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <ThemeProvider>
    <LanguageProvider>
    <BrowserRouter>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 'env(safe-area-inset-top)',
        backgroundColor: 'var(--th-nav-bg)',
        zIndex: 99999,
      }} />
      <div className="min-h-screen">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to={isAdmin ? '/admin' : isAuthenticated ? '/community' : '/login'} replace />} />

            {/* 일반 유저 */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/community" replace /> : <Login />} />
            <Route path="/community" element={isAuthenticated ? <CommunityLobby /> : <Navigate to="/login" replace />} />
            <Route path="/lobby" element={isAuthenticated ? <Lobby /> : <Navigate to="/login" replace />} />
            <Route path="/create-group" element={isAuthenticated ? <CreateGroup /> : <Navigate to="/login" replace />} />
            <Route path="/create-community" element={isAuthenticated ? <CreateCommunity /> : <Navigate to="/login" replace />} />
            <Route path="/manage-community" element={isAuthenticated ? <CommunitySettings /> : <Navigate to="/login" replace />} />
            <Route path="/community-members" element={isAuthenticated ? <CommunityMemberManage /> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} />
            <Route path="/invite/:roomId" element={isAuthenticated ? <Invite /> : <Navigate to="/login" replace />} />
            <Route path="/match-form/:roomId" element={isAuthenticated ? <MatchForm /> : <Navigate to="/login" replace />} />
            <Route path="/score-sheet/:boardGameId" element={isAuthenticated ? <ScoreSheet /> : <Navigate to="/login" replace />} />
            <Route path="/ranking/:roomId" element={isAuthenticated ? <Ranking /> : <Navigate to="/login" replace />} />

            {/* QR 코드 초대 링크 */}
            <Route path="/join" element={<JoinByQR />} />

            {/* OAuth2 콜백 */}
            <Route path="/oauth-callback" element={<OAuthCallback />} />

            {/* 관리자 (소셜 계정 role=ADMIN 만 접근. 별도 로그인 없이 소셜 로그인으로 진입) */}
            <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/login" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
    </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { setAccessToken } from './api/axios';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';

import './App.css';

const Login = lazy(() => import('./pages/Login'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Invite = lazy(() => import('./pages/Invite'));
const GameSelect = lazy(() => import('./pages/GameSelect'));
const MatchForm = lazy(() => import('./pages/MatchForm'));
const ScoreSheet = lazy(() => import('./pages/ScoreSheet'));
const Ranking = lazy(() => import('./pages/Ranking'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Admin = lazy(() => import('./pages/Admin'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const JoinByQR = lazy(() => import('./pages/JoinByQR'));

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
  useEffect(() => {
    if (window.location.hostname.includes('pages.dev')) {
      const nextUrl = `https://yadarank.com${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(nextUrl);
      return;
    }
  }, []);

  const isAuthenticated = !!localStorage.getItem('userId');
  const isAdmin = localStorage.getItem('role') === 'ADMIN';

  useEffect(() => {
    // 앱 시작 시 저장된 refresh token으로 access token 복구
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) return;
    axios.post(
      `${import.meta.env.VITE_API_URL}/auth/refresh`,
      { refreshToken: storedRefreshToken }
    ).then((res) => {
      setAccessToken(res.data.accessToken);
    }).catch(() => {
      // refresh token 없거나 만료 → 로그인 필요
    });
  }, []);

  return (
    <ThemeProvider>
    <LanguageProvider>
    <BrowserRouter>
      <div className="min-h-screen">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to={isAuthenticated ? '/lobby' : '/login'} replace />} />

            {/* 일반 유저 */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/lobby" replace /> : <Login />} />
            <Route path="/lobby" element={isAuthenticated ? <Lobby /> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} />
            <Route path="/invite/:roomId" element={isAuthenticated ? <Invite /> : <Navigate to="/login" replace />} />
            <Route path="/games/:roomId" element={isAuthenticated ? <GameSelect /> : <Navigate to="/login" replace />} />
            <Route path="/match-form/:roomId" element={isAuthenticated ? <MatchForm /> : <Navigate to="/login" replace />} />
            <Route path="/score-sheet/:boardGameId" element={isAuthenticated ? <ScoreSheet /> : <Navigate to="/login" replace />} />
            <Route path="/ranking/:roomId" element={isAuthenticated ? <Ranking /> : <Navigate to="/login" replace />} />

            {/* QR 코드 초대 링크 */}
            <Route path="/join" element={<JoinByQR />} />

            {/* OAuth2 콜백 */}
            <Route path="/oauth-callback" element={<OAuthCallback />} />

            {/* 관리자 */}
            <Route path="/admin-login" element={isAuthenticated ? <Navigate to="/lobby" replace /> : <AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/admin/login" replace />} />

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

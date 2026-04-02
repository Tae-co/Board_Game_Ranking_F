import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { setAccessToken } from './api/axios';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';

import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Invite from './pages/Invite';
import GameSelect from './pages/GameSelect';
import MatchForm from './pages/MatchForm';
import ScoreSheet from './pages/ScoreSheet';
import Ranking from './pages/Ranking';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import OAuthCallback from './pages/OAuthCallback';
import JoinByQR from './pages/JoinByQR';

import './App.css';

function App() {
  const isAuthenticated = () => !!localStorage.getItem('userId');
  const isAdmin = () => localStorage.getItem('role') === 'ADMIN';

  const PrivateRoute = ({ children }) =>
    isAuthenticated() ? children : <Navigate to="/login" replace />;

  const PublicRoute = ({ children }) =>
    isAuthenticated() ? <Navigate to="/lobby" replace /> : children;

  const AdminRoute = ({ children }) =>
    isAdmin() ? children : <Navigate to="/admin/login" replace />;

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
        <Routes>
          <Route path="/" element={<Navigate to={isAuthenticated() ? '/lobby' : '/login'} replace />} />

          {/* 일반 유저 */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/lobby" element={<PrivateRoute><Lobby /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/invite/:roomId" element={<PrivateRoute><Invite /></PrivateRoute>} />
          <Route path="/games/:roomId" element={<PrivateRoute><GameSelect /></PrivateRoute>} />
          <Route path="/match-form/:roomId" element={<PrivateRoute><MatchForm /></PrivateRoute>} />
          <Route path="/score-sheet/:boardGameId" element={<PrivateRoute><ScoreSheet /></PrivateRoute>} />
          <Route path="/ranking/:roomId" element={<PrivateRoute><Ranking /></PrivateRoute>} />

          {/* QR 코드 초대 링크 */}
          <Route path="/join" element={<JoinByQR />} />

          {/* OAuth2 콜백 */}
          <Route path="/oauth-callback" element={<OAuthCallback />} />

          {/* 관리자 */}
          <Route path="/admin-login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
    </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

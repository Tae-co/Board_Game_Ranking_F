import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 우리가 만든 페이지들 불러오기 (경로는 폴더 구조에 맞게 확인해주세요!)
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Invite from './pages/Invite';
import GameSelect from './pages/GameSelect';
import MatchForm from './pages/MatchForm';
import Ranking from './pages/Ranking';

import './App.css';

function App() {
  // 💡 핵심 1: 현재 로그인 상태인지 확인하는 함수
  const isAuthenticated = () => {
    return !!localStorage.getItem('userId'); // userId가 있으면 true, 없으면 false
  };

  // 💡 핵심 2: 로그인된 유저만 들어갈 수 있는 구역 (대기실, 게임방 등)
  const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
  };

  // 💡 핵심 3: 로그인 안 된 유저만 볼 수 있는 구역 (로그인 화면)
  // 이미 로그인했는데 /login으로 오면 대기실로 돌려보냄 (이게 바로 묻지도 따지지도 않는 자동 로그인!)
  const PublicRoute = ({ children }) => {
    return isAuthenticated() ? <Navigate to="/lobby" replace /> : children;
  };

  return (
    <BrowserRouter>
      <div className="app-container text-slate-900 bg-slate-50 min-h-screen font-sans">
        <Routes>
          {/* 기본 경로(/)로 오면 로그인 상태에 따라 알아서 보내줌 */}
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated() ? "/lobby" : "/login"} replace />} 
          />

          {/* 로그인 화면 (PublicRoute로 감싸서, 로그인된 사람은 못 보게 막음) */}
          <Route 
            path="/login" 
            element={<PublicRoute><Login /></PublicRoute>} 
          />

          {/* 아래는 모두 로그인해야만 들어갈 수 있는 화면들 (PrivateRoute로 감쌈) */}
          <Route path="/lobby" element={<PrivateRoute><Lobby /></PrivateRoute>} />
          <Route path="/invite/:roomId" element={<PrivateRoute><Invite /></PrivateRoute>} />
          <Route path="/games/:roomId" element={<PrivateRoute><GameSelect /></PrivateRoute>} />
          <Route path="/match-form/:roomId" element={<PrivateRoute><MatchForm /></PrivateRoute>} />
          <Route path="/ranking/:roomId" element={<PrivateRoute><Ranking /></PrivateRoute>} />
          
          {/* 이상한 주소를 치고 들어오면 기본 메인으로 돌려보냄 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
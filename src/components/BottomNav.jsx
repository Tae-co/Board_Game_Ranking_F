import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Gamepad2, Trophy } from 'lucide-react';

const BottomNav = ({ roomId }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { key: 'lobby', label: 'LOBBY', icon: Users, path: '/lobby' },
    { key: 'games', label: 'GAMES', icon: Gamepad2, path: roomId ? `/games/${roomId}` : null },
    { key: 'rankings', label: 'RANKINGS', icon: Trophy, path: roomId ? `/ranking/${roomId}` : null },
  ];

  const getActive = () => {
    if (location.pathname.startsWith('/lobby')) return 'lobby';
    if (location.pathname.startsWith('/games')) return 'games';
    if (location.pathname.startsWith('/ranking')) return 'rankings';
    if (location.pathname.startsWith('/invite')) return 'lobby';
    return 'lobby';
  };
  const active = getActive();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around"
      style={{
        backgroundColor: '#070F1E',
        borderTop: '1px solid #1E3A5F',
        height: '60px',
        maxWidth: '430px',
        margin: '0 auto',
        zIndex: 50,
      }}
    >
      {tabs.map(({ key, label, icon: Icon, path }) => {
        const isActive = active === key;
        const disabled = !path;
        return (
          <button
            key={key}
            onClick={() => path && navigate(path)}
            disabled={disabled}
            className="flex flex-col items-center gap-0.5 flex-1"
            style={{ opacity: disabled ? 0.3 : 1 }}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: isActive ? '#D4AF37' : '#8BA3C4' }}
            />
            <span
              className="font-bold"
              style={{
                fontSize: '9px',
                letterSpacing: '0.08em',
                color: isActive ? '#D4AF37' : '#8BA3C4',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const JoinByQR = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      navigate('/lobby');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login', { state: { redirectAfterLogin: `/join?code=${code}` } });
      return;
    }

    const join = async () => {
      try {
        const res = await api.post('/rooms/join', {
          inviteCode: code,
          memberId: Number(userId),
        });
        navigate(`/ranking/${res.data.roomId}`);
      } catch (e) {
        const msg = e?.response?.data?.message || '방 참여에 실패했습니다.';
        setError(msg);
        setTimeout(() => navigate('/lobby'), 2000);
      }
    };

    join();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: 'var(--th-bg)', color: 'var(--th-text)' }}>
      {error ? (
        <p style={{ color: '#dc2626' }}>{error}</p>
      ) : (
        <>
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--th-primary)', borderTopColor: 'transparent' }} />
          <p>방에 참여하는 중...</p>
        </>
      )}
    </div>
  );
};

export default JoinByQR;

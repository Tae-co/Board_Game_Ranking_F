import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { joinCommunity } from '../api/services/communities';
import { getAuthUserId } from '../auth/storage';

const JoinByQR = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      navigate('/community');
      return;
    }

    const userId = getAuthUserId();
    if (!userId) {
      navigate('/login', { state: { redirectAfterLogin: `/join?code=${code}` } });
      return;
    }

    const join = async () => {
      try {
        await joinCommunity(code);
        navigate('/community');
      } catch (e) {
        const msg = e?.response?.data?.message || '커뮤니티 참여에 실패했습니다.';
        setError(msg);
        setTimeout(() => navigate('/community'), 2000);
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
          <p>커뮤니티에 참여하는 중...</p>
        </>
      )}
    </div>
  );
};

export default JoinByQR;

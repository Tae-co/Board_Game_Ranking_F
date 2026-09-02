import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { joinCommunity } from '../api/services/communities';
import { getAuthUserId } from '../auth/storage';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import { joinErrorMessage } from '../utils/joinErrorMessage';

const JoinByQR = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [pendingCode, setPendingCode] = useState(null);
  const [joining, setJoining] = useState(false);

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

    setPendingCode(code);
  }, []);

  const handleConfirm = async () => {
    setJoining(true);
    try {
      await joinCommunity(pendingCode);
      const userId = getAuthUserId();
      queryClient.invalidateQueries({ queryKey: ['joinedCommunities', userId] });
      navigate('/community');
    } catch (e) {
      // 자동으로 넘기지 않는다. 정원 초과 같은 안내는 읽을 시간이 필요하다.
      setError(joinErrorMessage(e, t));
    } finally {
      setJoining(false);
    }
  };

  const handleCancel = () => {
    navigate('/community');
  };

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: V('--th-bg') }}>
        <div style={{
          backgroundColor: V('--th-card'), borderRadius: '20px',
          padding: '28px 24px', width: '100%', maxWidth: '320px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(239,68,68,0.12)',
          }}>
            <AlertCircle size={26} color="#ef4444" />
          </div>
          <p style={{ fontSize: '17px', fontWeight: '800', color: V('--th-text'), margin: '0 0 8px' }}>
            {t('community', 'joinFailedTitle')}
          </p>
          {/* 서버 메시지의 줄바꿈을 살린다 */}
          <p style={{ fontSize: '13.5px', color: V('--th-text-sub'), margin: '0 0 22px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/community')}
            style={{
              width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
              color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
            }}
          >
            {t('common', 'confirm')}
          </button>
        </div>
      </div>
    );
  }

  if (!pendingCode) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: V('--th-bg'), color: V('--th-text') }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `4px solid var(--th-primary)`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: V('--th-bg') }}>
      <div style={{
        backgroundColor: V('--th-card'), borderRadius: '20px',
        padding: '28px 24px', width: '100%', maxWidth: '320px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <p style={{ fontSize: '18px', fontWeight: '800', color: V('--th-text'), margin: '0 0 8px', textAlign: 'center' }}>
          {t('community', 'joinConfirmTitle')}
        </p>
        <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 16px', textAlign: 'center' }}>
          {t('community', 'joinConfirmDesc')}
        </p>
        <div style={{
          backgroundColor: V('--th-bg'), borderRadius: '12px',
          padding: '12px', marginBottom: '24px', textAlign: 'center',
          fontFamily: 'monospace', fontSize: '24px', fontWeight: '800',
          letterSpacing: '0.15em', color: V('--th-primary'),
        }}>
          {pendingCode}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleCancel}
            disabled={joining}
            style={{
              flex: 1, padding: '13px', borderRadius: '12px', border: `1px solid var(--th-border)`,
              backgroundColor: V('--th-bg'), color: V('--th-text'),
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
            }}
          >
            {t('common', 'cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={joining}
            style={{
              flex: 1, padding: '13px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
              color: '#fff', fontSize: '15px', fontWeight: '700', cursor: joining ? 'not-allowed' : 'pointer',
              opacity: joining ? 0.7 : 1,
            }}
          >
            {joining ? '...' : t('community', 'joinConfirmButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinByQR;

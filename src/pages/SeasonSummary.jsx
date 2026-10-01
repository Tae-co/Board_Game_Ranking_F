import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import NavAvatar from '../components/NavAvatar';
import SeasonSummaryCard from '../components/season/SeasonSummaryCard';
import { getCommunityStatus } from '../api/services/seasons';
import { EVENTS, logEvent } from '../api/services/events';
import { useSelectedCommunity } from '../hooks/useSelectedCommunity';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import { fill } from '../utils/seasonUtils';

/**
 * 모임 현황 — 최근 30일 (plan-season-reset §22). 방마다 시즌이 따로 돌아서 커뮤니티는
 * 시즌 대신 계속 밀려가는 기간으로 본다. 서버가 조회할 때마다 계산한다.
 */
const SeasonSummary = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { selectedCommunity } = useSelectedCommunity();
  const communityId = selectedCommunity?.communityId ?? null;

  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    if (!communityId) navigate('/community', { replace: true });
  }, [communityId, navigate]);

  // 경기 등록 시 ScoreSheet가 이 키를 비운다. 그 밖의 변화(남이 등록한 경기)는 1분 뒤 다시 받는다.
  const { data: summary, isLoading: loading } = useQuery({
    queryKey: ['communityStatus', communityId],
    queryFn: () => getCommunityStatus(communityId),
    enabled: !!communityId,
    staleTime: 1000 * 60,
  });

  const shareText = useMemo(() => {
    if (!summary) return '';
    const base = fill(t('season', 'shareText'), { community: summary.communityName });
    if (!summary.inviteCode) return base;
    // 코드를 손으로 옮겨 적지 않고 링크 한 번으로 참여하도록 (/join이 코드를 받아 처리)
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${base}\n${appUrl}/join?code=${summary.inviteCode}`;
  }, [summary, t]);

  const renderCard = async () => {
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
    });
  };

  const handleShare = async () => {
    if (!cardRef.current || busy) return;
    // 시상대가 유통을 늘렸는지 보려면 결산 카드 공유를 다른 공유와 구분해야 한다 (§10).
    logEvent(EVENTS.INVITE_SHARED, { communityId, props: { kind: 'status_card' } });
    setBusy(true);
    setShareError('');
    try {
      const blob = await renderCard();
      const file = new File([blob], `status-${summary.to}.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
      } else if (navigator.share) {
        await navigator.share({ title: summary.communityName, text: shareText });
      } else {
        downloadBlob(blob);
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setShareError(t('season', 'shareFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    setShareError('');
    try {
      downloadBlob(await renderCard());
    } catch {
      setShareError(t('season', 'shareFailed'));
    } finally {
      setBusy(false);
    }
  };

  const downloadBlob = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `status-${summary.to}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg') }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
        <div style={{ maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <button
            onClick={() => navigate('/lobby')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={22} color="var(--th-primary)" />
            <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--th-primary)' }}>
              {t('season', 'title')}
            </span>
          </button>
          <NavAvatar />
        </div>
      </div>

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '20px 20px 40px' }}>

        {loading ? (
          <div style={{ height: 420, borderRadius: 20, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }} />
        ) : summary ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SeasonSummaryCard ref={cardRef} summary={summary} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={handleShare}
                disabled={busy}
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: 14, border: 'none',
                  cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
                  background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Share2 size={16} />
                {busy ? t('season', 'sharing') : t('season', 'share')}
              </button>
              <button
                onClick={handleSave}
                disabled={busy}
                style={{
                  padding: '14px 16px', borderRadius: 14, cursor: busy ? 'default' : 'pointer',
                  backgroundColor: V('--th-btn-ghost-bg'), border: `1px solid var(--th-btn-ghost-border)`,
                  color: V('--th-btn-ghost-text'), display: 'flex', alignItems: 'center',
                }}
                aria-label={t('season', 'saveImage')}
              >
                <Download size={16} />
              </button>
            </div>

            {shareError && (
              <p style={{ marginTop: 10, fontSize: 13, color: '#EF4444', textAlign: 'center' }}>{shareError}</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default SeasonSummary;

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import NavAvatar from '../components/NavAvatar';
import SeasonSummaryCard from '../components/season/SeasonSummaryCard';
import { getSeasonPeriods, getSeasonSummary } from '../api/services/seasons';
import { useSelectedCommunity } from '../hooks/useSelectedCommunity';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';

const fill = (template, vars) =>
  template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');

const periodLabel = (period, lang) => {
  const [year, month] = period.split('-');
  return lang === 'ko'
    ? `${Number(month)}월`
    : new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short' });
};

const SeasonSummary = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { selectedCommunity } = useSelectedCommunity();
  const communityId = selectedCommunity?.communityId ?? null;

  const cardRef = useRef(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [busy, setBusy] = useState(false);
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    if (!communityId) navigate('/community', { replace: true });
  }, [communityId, navigate]);

  const { data: periods = [], isLoading: periodsLoading } = useQuery({
    queryKey: ['seasonPeriods', communityId],
    queryFn: () => getSeasonPeriods(communityId),
    enabled: !!communityId,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!selectedPeriod && periods.length > 0) setSelectedPeriod(periods[0].period);
  }, [periods, selectedPeriod]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['seasonSummary', communityId, selectedPeriod],
    queryFn: () => getSeasonSummary(communityId, selectedPeriod),
    enabled: !!communityId && !!selectedPeriod,
    staleTime: 1000 * 60 * 5,
  });

  const shareText = useMemo(() => {
    if (!summary) return '';
    return fill(t('season', 'shareText'), {
      community: summary.communityName,
      month: Number(summary.period.split('-')[1]),
      code: summary.inviteCode ?? '',
    });
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
    setBusy(true);
    setShareError('');
    try {
      const blob = await renderCard();
      const file = new File([blob], `season-${summary.period}.png`, { type: 'image/png' });

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
    a.download = `season-${summary.period}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loading = periodsLoading || (!!selectedPeriod && summaryLoading);

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

        {/* Period picker */}
        {periods.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
            {periods.map((p) => {
              const active = p.period === selectedPeriod;
              return (
                <button
                  key={p.period}
                  onClick={() => setSelectedPeriod(p.period)}
                  style={{
                    flexShrink: 0, padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
                    fontSize: 13, fontWeight: 700,
                    backgroundColor: active ? 'var(--th-primary)' : V('--th-card'),
                    color: active ? '#fff' : V('--th-text-sub'),
                    border: `1px solid ${active ? 'var(--th-primary)' : 'var(--th-border)'}`,
                  }}
                >
                  {periodLabel(p.period, lang)}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div style={{ height: 420, borderRadius: 20, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }} />
        ) : periods.length === 0 ? (
          <div style={{ borderRadius: 16, padding: '40px 20px', border: `2px dashed var(--th-border)`, textAlign: 'center' }}>
            <p style={{ color: V('--th-text'), fontSize: 14, fontWeight: 700, margin: '0 0 6px' }}>{t('season', 'noSeasons')}</p>
            <p style={{ fontSize: 13, color: V('--th-text-sub'), margin: 0, lineHeight: 1.5 }}>{t('season', 'noSeasonsDesc')}</p>
          </div>
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

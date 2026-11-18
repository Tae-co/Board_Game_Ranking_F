import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import { HELP_TOPICS } from '../constants/helpTopics';
import { usePractice } from '../practice/usePractice';
import HelpHeader from '../components/help/HelpHeader';
import PracticeFooter from '../components/help/PracticeFooter';
import RatingInfoModal from '../components/ranking/RatingInfoModal';

/** 사용방법 목록 (프로필 → 도움말 → 사용방법) */
const Help = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const practice = usePractice();
  const [showRatingInfo, setShowRatingInfo] = useState(false);

  const open = (topic) => {
    if (topic.key === 'score') setShowRatingInfo(true);
    else navigate(`/help/${topic.key}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
      <HelpHeader onBack={() => navigate(-1)} title={t('help', 'title')} />

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: '22px', fontWeight: 800, color: V('--th-text'), margin: 0 }}>{t('help', 'listTitle')}</p>
        <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: '0 0 8px', lineHeight: 1.5 }}>{t('help', 'listDesc')}</p>

        {HELP_TOPICS.map((topic) => {
          const Icon = topic.icon;
          return (
            <button
              key={topic.key}
              onClick={() => open(topic)}
              style={{
                width: '100%', padding: '16px', borderRadius: '18px', textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '14px', flexShrink: 0,
                background: 'linear-gradient(135deg, #6B5CE7 0%, #7B8FF5 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: V('--th-text'), marginBottom: 3 }}>{t('help', `${topic.key}Title`)}</div>
                <div style={{ fontSize: '12px', color: V('--th-text-sub'), lineHeight: 1.45 }}>{t('help', `${topic.key}Desc`)}</div>
              </div>
              {topic.steps > 0 && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: V('--th-primary'), flexShrink: 0 }}>
                  {t('help', 'steps').replace('{n}', topic.steps)}
                </span>
              )}
              <ChevronRight size={18} color="var(--th-text-sub)" style={{ flexShrink: 0 }} />
            </button>
          );
        })}
      </div>

      <PracticeFooter onClick={() => practice.start()} t={t} />

      {showRatingInfo && <RatingInfoModal onClose={() => setShowRatingInfo(false)} t={t} />}
    </div>
  );
};

export default Help;

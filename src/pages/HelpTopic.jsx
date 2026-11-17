import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { V } from '../utils/cssUtils';
import { HELP_TOPICS } from '../constants/helpTopics';
import { usePractice } from '../practice/usePractice';
import HelpHeader from '../components/help/HelpHeader';
import PracticeFooter from '../components/help/PracticeFooter';

/** 사용방법 한 주제 — 번호 붙은 단계 카드를 세로선으로 잇는다 */
const HelpTopic = () => {
  const { topic: key } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const practice = usePractice();
  const topic = HELP_TOPICS.find(tp => tp.key === key && tp.steps > 0);

  if (!topic) return <Navigate to="/help" replace />;
  const steps = Array.from({ length: topic.steps }, (_, i) => i + 1);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: V('--th-bg'), paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
      <HelpHeader onBack={() => navigate(-1)} title={t('help', 'title')} />

      <div style={{ maxWidth: 390, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <p style={{ fontSize: '22px', fontWeight: 800, color: V('--th-text'), margin: '0 0 6px' }}>{t('help', `${key}Title`)}</p>
          <p style={{ fontSize: '13px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.5 }}>{t('help', `${key}Intro`)}</p>
        </div>

        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {steps.map((n) => {
            const last = n === steps.length;
            return (
              <li key={n} style={{ position: 'relative', display: 'flex', gap: 14, paddingBottom: last ? 0 : 18 }}>
                {!last && (
                  <div aria-hidden="true" style={{ position: 'absolute', left: 15, top: 34, bottom: -14, width: 2, backgroundColor: V('--th-border') }} />
                )}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0, position: 'relative',
                  backgroundColor: V('--th-primary'), color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800,
                }}>
                  {n}
                </div>
                <div style={{
                  flex: 1, minWidth: 0, backgroundColor: V('--th-card'),
                  border: `1px solid var(--th-border)`, borderRadius: '14px', padding: '12px 14px',
                }}>
                  <p style={{ fontSize: '14px', fontWeight: 800, color: V('--th-text'), margin: '0 0 4px' }}>{t('help', `${key}${n}Title`)}</p>
                  <p style={{ fontSize: '12px', color: V('--th-text-sub'), margin: 0, lineHeight: 1.5 }}>{t('help', `${key}${n}Desc`)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <PracticeFooter onClick={() => practice.start()} t={t} />
    </div>
  );
};

export default HelpTopic;

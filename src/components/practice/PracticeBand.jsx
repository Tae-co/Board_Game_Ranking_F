import { Check } from 'lucide-react';
import { usePractice } from '../../practice/usePractice';
import { V } from '../../utils/cssUtils';

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'];

/** 연습 화면마다 헤더 바로 아래 띠: 연습 중 · 실제로 저장되지 않아요 · n / 4, 네 칸 진행, 연습 끝내기 */
const PracticeBand = ({ t }) => {
  const practice = usePractice();
  if (!practice.active || practice.step === 'done') return null;
  const current = practice.progress;

  return (
    <div style={{ backgroundColor: V('--th-nav-bg'), borderBottom: `1px solid var(--th-border)` }}>
      <div style={{ maxWidth: 390, margin: '0 auto', padding: '10px 20px 12px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{
              fontSize: '11px', fontWeight: 800, flexShrink: 0,
              color: V('--th-practice-text'), backgroundColor: V('--th-practice-bg'),
              borderRadius: '20px', padding: '3px 9px',
            }}>
              {t('practice', 'bandBadge')}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: V('--th-text-sub'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('practice', 'bandNote').replace('{n}', current)}
            </span>
          </div>
          <button
            onClick={() => practice.finish()}
            style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: V('--th-text-sub'), flexShrink: 0 }}
          >
            {t('practice', 'end')}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {STEP_KEYS.map((key, i) => {
            const n = i + 1;
            const done = n < current;
            const now = n === current;
            return (
              <div key={key} style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  height: 4, borderRadius: 2, marginBottom: 6,
                  backgroundColor: done || now ? V('--th-primary') : V('--th-border'),
                  opacity: now ? 0.45 : 1,
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
                  {done && <Check size={11} strokeWidth={3} color="var(--th-primary)" style={{ flexShrink: 0 }} />}
                  <span style={{
                    fontSize: '10px', fontWeight: now ? 800 : 600,
                    color: now ? V('--th-text') : V('--th-text-sub'),
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {t('practice', key)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PracticeBand;

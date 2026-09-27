import { V } from '../../utils/cssUtils';
import { periodMonthLabel } from '../../utils/seasonUtils';

/**
 * 시즌별 내 점수 추이. 점 하나짜리 그래프는 고장으로 보이므로 2시즌 미만이면
 * 호출부가 이 컴포넌트를 아예 렌더하지 않는다 (기획 §6 빈 상태).
 *
 * 차트 라이브러리를 넣지 않는다 — 점 몇 개를 잇는 선이고, 방 화면은 이미 무겁다.
 */
const HEIGHT = 96;
const MAX_POINTS = 6; // 최근 6시즌. 390px 폭에서 라벨이 겹치지 않는 한계다

const SeasonTrend = ({ history, lang, t }) => {
  const points = history.slice(-MAX_POINTS);
  const scores = points.map((p) => p.displayScore);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const span = max - min || 1;

  // 전 시즌이 같은 점수면 선이 위아래 끝에 붙는다 — 그때는 가운데에 둔다.
  const yOf = (score) => (max === min ? HEIGHT / 2 : HEIGHT - ((score - min) / span) * (HEIGHT - 16) - 8);
  const xOf = (index) => (points.length === 1 ? 50 : (index / (points.length - 1)) * 100);

  return (
    <div style={{
      borderRadius: 14, padding: '14px 12px', backgroundColor: V('--th-card'),
      border: `1px solid var(--th-border)`,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: V('--th-text-sub'),
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10,
      }}>
        {t('season', 'scoreTrend')}
      </div>

      <svg
        viewBox={`0 0 100 ${HEIGHT}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: HEIGHT, display: 'block', overflow: 'visible' }}
      >
        <polyline
          points={points.map((p, i) => `${xOf(i)},${yOf(p.displayScore)}`).join(' ')}
          fill="none"
          stroke="var(--th-primary)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle
            key={p.seasonKey}
            cx={xOf(i)}
            cy={yOf(p.displayScore)}
            r="2.5"
            fill="var(--th-primary)"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div style={{ display: 'flex', marginTop: 6 }}>
        {points.map((p) => (
          <div key={p.seasonKey} style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: V('--th-text') }}>
              {Math.round(p.displayScore).toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: V('--th-text-sub') }}>
              {periodMonthLabel(p.seasonKey, lang)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeasonTrend;

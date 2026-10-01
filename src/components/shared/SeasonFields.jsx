import { V } from '../../utils/cssUtils';
import { minEndDate, SEASON_NAME_MAX } from '../../utils/seasonUtils';

const labelStyle = {
  fontSize: '11px', fontWeight: '700', color: V('--th-text-sub'),
  letterSpacing: '0.08em', marginBottom: '10px', display: 'block',
};

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '12px',
  border: `1px solid ${V('--th-border')}`, backgroundColor: V('--th-card'),
  color: V('--th-text'), fontSize: '15px', fontWeight: '600', outline: 'none', boxSizing: 'border-box',
};

/**
 * 시즌 이름 + 종료일 입력 (plan-season-reset §22). 방 만들기와 호스트 시즌 수정에서 같이 쓴다.
 * 종료일은 내일 이후만 고를 수 있다 — 서버도 같은 규칙으로 막는다.
 */
const SeasonFields = ({ name, setName, endDate, setEndDate, region, t }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div>
      <label style={labelStyle}>{t('season', 'seasonNameLabel')}</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, SEASON_NAME_MAX))}
        placeholder={t('season', 'seasonNamePlaceholder')}
        style={inputStyle}
      />
    </div>
    <div>
      <label style={labelStyle}>{t('season', 'seasonEndLabel')}</label>
      <input
        type="date"
        value={endDate}
        min={minEndDate(region)}
        onChange={(e) => setEndDate(e.target.value)}
        style={inputStyle}
      />
      <p style={{ fontSize: '11px', color: V('--th-text-sub'), margin: '6px 0 0', lineHeight: 1.5 }}>
        {t('season', 'seasonEndHint')}
      </p>
    </div>
  </div>
);

export default SeasonFields;

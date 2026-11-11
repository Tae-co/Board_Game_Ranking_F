import { V } from '../../utils/cssUtils';
import { REGION_NAMES } from '../../constants/regions';

const REGIONS = [...REGION_NAMES, 'Other'];

const labelStyle = { fontSize: '14px', fontWeight: '600', color: V('--th-text'), display: 'block', marginBottom: '8px' };
const fieldStyle = {
  width: '100%', padding: '13px 16px', boxSizing: 'border-box',
  borderRadius: '12px', border: `1px solid var(--th-border)`,
  backgroundColor: V('--th-bg'), color: V('--th-text'),
  fontSize: '14px', outline: 'none',
};

/** 커뮤니티 만들기·수정 화면의 이름·지역 입력 (카드 안에 넣어 쓴다) */
const CommunityInfoFields = ({ name, onNameChange, region, onRegionChange, t }) => (
  <>
    <div>
      <label style={labelStyle}>{t('community', 'communityNameLabel')}</label>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={t('community', 'communityNamePlaceholder')}
        style={fieldStyle}
      />
    </div>

    <div>
      <label style={labelStyle}>{t('community', 'regionLabel')}</label>
      <select
        value={region}
        onChange={(e) => onRegionChange(e.target.value)}
        style={{
          ...fieldStyle,
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: '40px',
        }}
      >
        {REGIONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>
  </>
);

export default CommunityInfoFields;

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';
import { MAX_CHIP_DENOMINATIONS, chipDenomColor, chipDigitsOf } from '../../utils/chipUtils';

/**
 * 칩 세기 방식 게임에서 쓸 칩 종류(액면가). 점수판에서 플레이어마다 칩 종류별 남은 개수를 적는다.
 * value는 큰 값부터 정렬된 숫자 배열. 칩을 누르면 빠진다.
 */
const ChipDenominationsField = ({ value, onChange }) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const canAdd = Number(input) > 0;

  const add = () => {
    const n = Number(input);
    if (!(n > 0)) return;
    onChange(value.includes(n) ? value : [...value, n].sort((a, b) => b - a));
    setInput('');
  };

  return (
    <>
      <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: 8 }}>
        {t('lobby', 'customChipDenoms')}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {value.map((d, i) => (
          <button
            key={d}
            type="button"
            onClick={() => onChange(value.filter(x => x !== d))}
            aria-label={t('lobby', 'customChipDenomRemove').replace('{n}', d.toLocaleString('en-US'))}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 999,
              border: 'none', cursor: 'pointer', backgroundColor: chipDenomColor(i), color: '#fff',
              fontSize: 13, fontWeight: 700,
            }}
          >
            {d.toLocaleString('en-US')}
            <X size={12} />
          </button>
        ))}
      </div>
      {value.length < MAX_CHIP_DENOMINATIONS && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input
            type="text"
            inputMode="numeric"
            value={input ? Number(input).toLocaleString('en-US') : ''}
            placeholder={t('lobby', 'customChipDenomPlaceholder')}
            onChange={(e) => setInput(chipDigitsOf(e.target.value, 9))}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            style={{
              flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: 12,
              backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`,
              color: V('--th-text'), fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            disabled={!canAdd}
            onClick={add}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '0 14px', borderRadius: 12, border: 'none',
              backgroundColor: canAdd ? V('--th-primary') : V('--th-border'),
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: canAdd ? 'pointer' : 'default',
            }}
          >
            <Plus size={14} />
            {t('lobby', 'customChipDenomAdd')}
          </button>
        </div>
      )}
      <p style={{ fontSize: 11, color: V('--th-text-sub'), lineHeight: 1.4, margin: '0 0 8px' }}>
        {t('lobby', 'customChipDenomsHint')}
      </p>
    </>
  );
};

export default ChipDenominationsField;

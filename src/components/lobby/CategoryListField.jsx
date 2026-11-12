import { X, Plus } from 'lucide-react';
import { V } from '../../utils/cssUtils';
import { newCategory } from '../../scoreSheets/customSchema';

// 점수판의 카테고리 열은 좁아서, 길면 두 줄로 넘어가 표가 어긋난다
const CATEGORY_MAX_LENGTH = 8;

// 칸별 점수 게임의 항목 목록: 이름(8자), 감점 토글, 삭제(마지막 하나는 못 지움), 추가
const CategoryListField = ({ categories, setCategories, t }) => {
  const updateCategory = (uid, patch) =>
    setCategories(prev => prev.map(c => (c.uid === uid ? { ...c, ...patch } : c)));

  return (
    <>
      <p style={{ fontSize: 11, fontWeight: 700, color: V('--th-text-sub'), letterSpacing: '0.08em', marginBottom: 8 }}>
        {t('lobby', 'customCategories')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {categories.map((cat, idx) => (
          <div key={cat.uid} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
              <input
                type="text"
                value={cat.label}
                maxLength={CATEGORY_MAX_LENGTH}
                onChange={(e) => updateCategory(cat.uid, { label: e.target.value.slice(0, CATEGORY_MAX_LENGTH) })}
                placeholder={t('lobby', 'customCategoryPlaceholder')}
                style={{
                  width: '100%', padding: '10px 34px 10px 12px', borderRadius: 10,
                  backgroundColor: V('--th-card'), border: `1px solid var(--th-border)`,
                  color: V('--th-text'), fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <span style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 11, color: V('--th-text-sub'), pointerEvents: 'none',
              }}>
                {cat.label.length}/{CATEGORY_MAX_LENGTH}
              </span>
            </div>
            <button
              onClick={() => updateCategory(cat.uid, { negative: !cat.negative })}
              title={t('lobby', 'customNegativeHint')}
              style={{
                flexShrink: 0, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                backgroundColor: cat.negative ? '#ef4444' : V('--th-card'),
                color: cat.negative ? '#fff' : V('--th-text-sub'),
                border: `1px solid ${cat.negative ? '#ef4444' : 'var(--th-border)'}`,
              }}
            >
              {t('lobby', 'customNegative')}
            </button>
            <button
              onClick={() => setCategories(prev => prev.filter(c => c.uid !== cat.uid))}
              disabled={categories.length === 1}
              style={{
                flexShrink: 0, background: 'none', border: 'none', padding: 4,
                cursor: categories.length === 1 ? 'not-allowed' : 'pointer',
                opacity: categories.length === 1 ? 0.3 : 1,
                color: V('--th-text-sub'),
              }}
              aria-label={`remove category ${idx + 1}`}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setCategories(prev => [...prev, newCategory()])}
        style={{
          width: '100%', padding: '10px', borderRadius: 10, marginBottom: 8,
          backgroundColor: 'transparent', border: `1px dashed var(--th-border)`,
          color: V('--th-text-sub'), fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        {t('lobby', 'customAddCategory')}
      </button>

      <p style={{ fontSize: 11, color: V('--th-text-sub'), lineHeight: 1.4, margin: '0 0 24px' }}>
        {t('lobby', 'customNegativeHint')}
      </p>
    </>
  );
};

export default CategoryListField;

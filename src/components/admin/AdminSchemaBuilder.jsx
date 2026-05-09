import { Trash2 } from 'lucide-react';

const inputStyle = { fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--th-border)', backgroundColor: 'var(--th-card)', color: 'var(--th-text)', outline: 'none' };

const AdminSchemaBuilder = ({
  schemaType, setSchemaType,
  schemaCategories, setSchemaCategories,
  schemaSections, setSchemaSections,
  newCategory, newSection,
}) => (
  <div className="space-y-2 pt-1">
    <label className="block text-xs" style={{ color: 'var(--th-text-sub)' }}>점수판 타입</label>
    <div className="flex gap-2">
      {[['none', '없음'], ['flat', '일반형'], ['sectioned', '섹션형']].map(([val, label]) => (
        <button
          key={val}
          onClick={() => { setSchemaType(val); setSchemaCategories([]); setSchemaSections([]); }}
          className="flex-1 py-2 rounded-lg text-xs font-bold border transition-all"
          style={{
            backgroundColor: schemaType === val ? 'var(--th-primary)' : 'transparent',
            color: schemaType === val ? '#fff' : 'var(--th-text-sub)',
            borderColor: schemaType === val ? 'var(--th-primary)' : 'var(--th-border)',
          }}
        >
          {label}
        </button>
      ))}
    </div>

    {/* flat 카테고리 빌더 */}
    {schemaType === 'flat' && (
      <div className="space-y-2 pt-1">
        {schemaCategories.map((cat, i) => (
          <div key={cat.key} style={{ padding: '8px', borderRadius: 8, backgroundColor: 'var(--th-bg)', border: '1px solid var(--th-border)' }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 5 }}>
              <input
                placeholder="🎲"
                value={cat.icon}
                onChange={e => setSchemaCategories(prev => prev.map((c, idx) => idx === i ? { ...c, icon: e.target.value } : c))}
                style={{ width: 30, textAlign: 'center', fontSize: 15, border: 'none', background: 'transparent', outline: 'none', color: 'var(--th-text)', flexShrink: 0 }}
              />
              <input placeholder="한글명" value={cat.label} onChange={e => setSchemaCategories(prev => prev.map((c, idx) => idx === i ? { ...c, label: e.target.value } : c))} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <input placeholder="English" value={cat.labelEn} onChange={e => setSchemaCategories(prev => prev.map((c, idx) => idx === i ? { ...c, labelEn: e.target.value } : c))} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
              <input type="color" value={cat.color} onChange={e => setSchemaCategories(prev => prev.map((c, idx) => idx === i ? { ...c, color: e.target.value } : c))} style={{ width: 24, height: 24, padding: 2, borderRadius: 4, border: 'none', cursor: 'pointer' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--th-text-sub)', cursor: 'pointer' }}>
                <input type="checkbox" checked={cat.negative} onChange={e => setSchemaCategories(prev => prev.map((c, idx) => idx === i ? { ...c, negative: e.target.checked } : c))} />
                ��점
              </label>
              <button onClick={() => setSchemaCategories(prev => prev.filter((_, idx) => idx !== i))} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => setSchemaCategories(prev => [...prev, newCategory()])}
          className="w-full py-2 rounded-lg text-xs border transition-colors"
          style={{ borderColor: 'var(--th-primary)', color: 'var(--th-primary)', backgroundColor: 'transparent', borderStyle: 'dashed' }}
        >
          + 카테고리 추가
        </button>
      </div>
    )}

    {/* sectioned 섹션 빌더 */}
    {schemaType === 'sectioned' && (
      <div className="space-y-2 pt-1">
        {schemaSections.map((section, si) => (
          <div key={section.id} style={{ border: '1px solid var(--th-border)', borderRadius: 10, padding: 10 }}>
            <div style={{ display: 'flex', gap: 5, marginBottom: 8, alignItems: 'center' }}>
              <input placeholder="섹션명 (한글)" value={section.title} onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, title: e.target.value } : s))} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <input placeholder="Section (English)" value={section.titleEn} onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, titleEn: e.target.value } : s))} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <button onClick={() => setSchemaSections(prev => prev.filter((_, idx) => idx !== si))} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                <Trash2 size={13} />
              </button>
            </div>
            {section.categories.map((cat, ci) => (
              <div key={cat.key} style={{ padding: '6px', borderRadius: 6, backgroundColor: 'var(--th-bg)', border: '1px solid var(--th-border)', marginBottom: 4 }}>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 4 }}>
                  <input placeholder="🎲" value={cat.icon} onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, categories: s.categories.map((c, cidx) => cidx === ci ? { ...c, icon: e.target.value } : c) } : s))} style={{ width: 28, textAlign: 'center', fontSize: 14, border: 'none', background: 'transparent', outline: 'none', color: 'var(--th-text)', flexShrink: 0 }} />
                  <input placeholder="한글명" value={cat.label} onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, categories: s.categories.map((c, cidx) => cidx === ci ? { ...c, label: e.target.value } : c) } : s))} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
                  <input placeholder="English" value={cat.labelEn} onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, categories: s.categories.map((c, cidx) => cidx === ci ? { ...c, labelEn: e.target.value } : c) } : s))} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                  <input type="color" value={cat.color} onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, categories: s.categories.map((c, cidx) => cidx === ci ? { ...c, color: e.target.value } : c) } : s))} style={{ width: 22, height: 22, padding: 2, borderRadius: 4, border: 'none', cursor: 'pointer' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--th-text-sub)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={cat.negative} onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, categories: s.categories.map((c, cidx) => cidx === ci ? { ...c, negative: e.target.checked } : c) } : s))} />
                    감점
                  </label>
                  <button onClick={() => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, categories: s.categories.filter((_, cidx) => cidx !== ci) } : s))} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, categories: [...s.categories, newCategory()] } : s))}
              className="w-full py-1.5 rounded-lg text-xs border transition-colors"
              style={{ borderColor: 'var(--th-border)', color: 'var(--th-text-sub)', backgroundColor: 'transparent', borderStyle: 'dashed' }}
            >
              + 카테고리 추가
            </button>
          </div>
        ))}
        <button
          onClick={() => setSchemaSections(prev => [...prev, newSection()])}
          className="w-full py-2 rounded-lg text-xs border transition-colors"
          style={{ borderColor: 'var(--th-primary)', color: 'var(--th-primary)', backgroundColor: 'transparent', borderStyle: 'dashed' }}
        >
          + 섹션 추가
        </button>
      </div>
    )}
  </div>
);

export default AdminSchemaBuilder;

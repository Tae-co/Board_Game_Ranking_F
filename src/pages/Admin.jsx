import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Shield, Eye } from 'lucide-react';
import api, { setAccessToken, getAccessToken, ensureToken } from '../api/axios';
import { clearAuthSession } from '../auth/storage';
import { useLanguage } from '../i18n/LanguageContext';

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('games');

  // 게임 관리 상태
  const [games, setGames] = useState([]);
  const [form, setForm] = useState({ name: '', minPlayers: 2, maxPlayers: 6, imageUrl: '' });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [gamePage, setGamePage] = useState(location.state?.returnPage ?? 0);

  const GAMES_PER_PAGE = 6;

  // 점수판 스키마 빌더 상태
  const [schemaType, setSchemaType] = useState('none'); // 'none' | 'flat' | 'sectioned'
  const [schemaCategories, setSchemaCategories] = useState([]); // flat용
  const [schemaSections, setSchemaSections] = useState([]);     // sectioned용

  // 멤버 관리 상태
  const [members, setMembers] = useState([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  const newCategory = () => ({
    key: `cat_${Math.random().toString(36).slice(2, 8)}`,
    label: '', labelEn: '', icon: '', color: '#6b5ce7', negative: false,
  });

  const newSection = () => ({
    id: Math.random().toString(36).slice(2, 8),
    title: '', titleEn: '', categories: [newCategory()],
  });

  const buildSchemaJson = () => {
    if (schemaType === 'none') return null;
    if (schemaType === 'flat') {
      return JSON.stringify({
        name: form.name, type: 'flat',
        categories: schemaCategories.map(({ key, label, labelEn, icon, color, negative }) => ({
          key, label, labelEn, icon, color, ...(negative && { negative: true }),
        })),
      });
    }
    if (schemaType === 'sectioned') {
      return JSON.stringify({
        name: form.name, type: 'sectioned',
        sections: schemaSections.map(({ title, titleEn, categories }) => ({
          title, titleEn,
          categories: categories.map(({ key, label, labelEn, icon, color, negative }) => ({
            key, label, labelEn, icon, color, ...(negative && { negative: true }),
          })),
        })),
      });
    }
    return null;
  };

  const validateSchemaUI = () => {
    if (schemaType === 'flat') {
      if (schemaCategories.length === 0) return '카테고리를 1개 이상 추가해주세요.';
      for (const c of schemaCategories) {
        if (!c.label || !c.labelEn) return '모든 카테고리에 한글명과 영문명을 입력해주세요.';
      }
    }
    if (schemaType === 'sectioned') {
      if (schemaSections.length === 0) return '섹션을 1개 이상 추가해주세요.';
      for (const s of schemaSections) {
        if (!s.title || !s.titleEn) return '모든 섹션에 한글명과 영문명을 입력해주세요.';
        for (const c of s.categories) {
          if (!c.label || !c.labelEn) return '모든 카테고리에 한글명과 영문명을 입력해주세요.';
        }
      }
    }
    return null;
  };

  const fetchGames = async () => {
    try {
      await ensureToken();
      const res = await api.get('/admin/games');
      setGames(res.data || []);
    } catch {
      alert(t('admin', 'loadFailed'));
    }
  };

  const fetchMembers = async () => {
    setIsMembersLoading(true);
    try {
      const res = await api.get('/admin/members');
      setMembers(res.data || []);
    } catch {
      console.error('멤버 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) { alert(t('admin', 'gameNamePlaceholder')); return; }
    if (form.minPlayers < 1 || form.maxPlayers < form.minPlayers) {
      alert(t('admin', 'saveFailed'));
      return;
    }
    const schemaError = validateSchemaUI();
    if (schemaError) { alert(schemaError); return; }

    setIsSubmitting(true);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const token = getAccessToken();
        const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/upload-image`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }
      const schemaJson = buildSchemaJson();
      const payload = { ...form, imageUrl, schemaJson };
      if (editingId) {
        await api.put(`/admin/games/${editingId}`, payload);
      } else {
        await api.post('/admin/games', payload);
      }
      setForm({ name: '', minPlayers: 2, maxPlayers: 6, imageUrl: '' });
      setEditingId(null);
      setImageFile(null);
      setImagePreview('');
      setSchemaType('none');
      setSchemaCategories([]);
      setSchemaSections([]);
      setShowForm(false);
      setGamePage(0);
      await fetchGames();
    } catch {
      alert(t('admin', 'saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleEdit = (game) => {
    setEditingId(game.id);
    setForm({
      name: game.name,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
      imageUrl: game.imageUrl || '',
    });
    setImageFile(null);
    setImagePreview(game.imageUrl || '');
    // schemaJson 파싱해서 빌더 상태 복원
    if (game.schemaJson) {
      try {
        const parsed = JSON.parse(game.schemaJson);
        setSchemaType(parsed.type || 'none');
        if (parsed.type === 'flat') setSchemaCategories(parsed.categories || []);
        if (parsed.type === 'sectioned') setSchemaSections(
          (parsed.sections || []).map(s => ({ ...s, id: Math.random().toString(36).slice(2, 8) }))
        );
      } catch {
        setSchemaType('none');
        setSchemaCategories([]);
        setSchemaSections([]);
      }
    } else {
      setSchemaType('none');
      setSchemaCategories([]);
      setSchemaSections([]);
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (game) => {
    if (!window.confirm(`"${game.name}"${t('admin', 'deleteConfirm')}`)) return;
    try {
      await api.delete(`/admin/games/${game.id}`);
      setGamePage(0);
      await fetchGames();
    } catch {
      alert(t('admin', 'deleteFailed'));
    }
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setForm({ name: '', minPlayers: 2, maxPlayers: 6, imageUrl: '' });
    setImageFile(null);
    setImagePreview('');
    setSchemaType('none');
    setSchemaCategories([]);
    setSchemaSections([]);
    setShowForm(false);
    setGamePage(0);
  };

  const handleLogout = () => {
    setAccessToken(null);
    clearAuthSession();
    window.location.replace('/admin-login');
  };

  const inputStyle = {
    backgroundColor: 'var(--th-bg)',
    borderColor: 'var(--th-border)',
    color: 'var(--th-text)',
  };

  const tabs = [
    { key: 'games', label: t('admin', 'gamesTab') },
    { key: 'members', label: t('admin', 'membersTab') },
    { key: 'settings', label: t('admin', 'settingsTab') },
  ];

  return (
    <div className="min-h-screen pb-8" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: 'var(--th-bg)' }}>

      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: 'var(--th-nav-bg)' }}>
        <div className="flex items-center">
          <button
            onClick={() => navigate('/community')}
            className="mr-3 p-2 rounded-lg transition-colors"
            style={{ color: 'var(--th-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-card)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Shield className="w-6 h-6 mr-2" style={{ color: 'var(--th-primary)' }} />
          <h1 className="text-xl" style={{ color: 'var(--th-text)' }}>{t('admin', 'title')}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-bold transition-colors"
          style={{ color: 'var(--th-text-sub)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--th-text-sub)'}
        >
          {t('common', 'logout')}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--th-card)', border: '1px solid var(--th-border)' }}>
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                if (key !== activeTab) {
                  if (key === 'members') fetchMembers();
                  if (key === 'games') setGamePage(0);
                  setActiveTab(key);
                }
              }}
              className="flex-1 py-2 px-1 rounded-lg text-xs transition-all"
              style={{
                backgroundColor: activeTab === key ? 'var(--th-primary)' : 'transparent',
                color: activeTab === key ? '#FFFFFF' : 'var(--th-text-sub)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">

        {/* 게임 관리 탭 */}
        {activeTab === 'games' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ color: 'var(--th-text)' }}>{t('admin', 'registeredGames')} ({games.length})</h2>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-opacity"
                  style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Plus className="w-4 h-4" />
                  {t('admin', 'addGame')}
                </button>
              )}
            </div>

            {/* 추가/수정 폼 */}
            {showForm && (
              <div className="rounded-2xl p-5 mb-5 border shadow-sm" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
                <p className="mb-4" style={{ color: 'var(--th-text)' }}>{editingId ? t('admin', 'editGameTitle') : t('admin', 'addGameTitle')}</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={t('admin', 'gameNamePlaceholder')}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none"
                    style={inputStyle}
                    value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
                  />
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block mb-1.5 text-xs" style={{ color: 'var(--th-text-sub)' }}>{t('admin', 'minPlayers')}</label>
                      <input
                        type="number"
                        min={1} max={10}
                        className="w-full px-4 py-3 rounded-lg border text-center focus:outline-none"
                        style={inputStyle}
                        value={form.minPlayers}
                        onChange={(e) => setForm(p => ({ ...p, minPlayers: Number(e.target.value) }))}
                        onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block mb-1.5 text-xs" style={{ color: 'var(--th-text-sub)' }}>{t('admin', 'maxPlayers')}</label>
                      <input
                        type="number"
                        min={1} max={10}
                        className="w-full px-4 py-3 rounded-lg border text-center focus:outline-none"
                        style={inputStyle}
                        value={form.maxPlayers}
                        onChange={(e) => setForm(p => ({ ...p, maxPlayers: Number(e.target.value) }))}
                        onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
                      />
                    </div>
                  </div>

                  {/* 이미지 업로드 */}
                  <div className="space-y-2">
                    <label className="block text-xs" style={{ color: 'var(--th-text-sub)' }}>{t('admin', 'imageLabel')}</label>
                    <label
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border cursor-pointer transition-colors"
                      style={{ backgroundColor: 'var(--th-bg)', borderColor: 'var(--th-border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--th-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--th-border)'}
                    >
                      <span style={{ color: 'var(--th-primary)' }}>📁</span>
                      <span className="text-sm truncate" style={{ color: 'var(--th-text-sub)' }}>
                        {imageFile ? imageFile.name : t('admin', 'selectImage')}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                    {(imagePreview || form.imageUrl) && (
                      <div className="relative w-20 h-20">
                        <img
                          src={imagePreview || form.imageUrl}
                          alt="preview"
                          className="w-full h-full object-cover rounded-xl border"
                          style={{ borderColor: 'var(--th-border)' }}
                        />
                        <button
                          onClick={() => { setImageFile(null); setImagePreview(''); setForm(p => ({ ...p, imageUrl: '' })); }}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                          style={{ backgroundColor: '#dc2626' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 점수판 스키마 빌더 */}
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
                              <input
                                placeholder="한글명"
                                value={cat.label}
                                onChange={e => setSchemaCategories(prev => prev.map((c, idx) => idx === i ? { ...c, label: e.target.value } : c))}
                                style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--th-border)', backgroundColor: 'var(--th-card)', color: 'var(--th-text)', outline: 'none' }}
                              />
                              <input
                                placeholder="English"
                                value={cat.labelEn}
                                onChange={e => setSchemaCategories(prev => prev.map((c, idx) => idx === i ? { ...c, labelEn: e.target.value } : c))}
                                style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--th-border)', backgroundColor: 'var(--th-card)', color: 'var(--th-text)', outline: 'none' }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                              <input
                                type="color"
                                value={cat.color}
                                onChange={e => setSchemaCategories(prev => prev.map((c, idx) => idx === i ? { ...c, color: e.target.value } : c))}
                                style={{ width: 24, height: 24, padding: 2, borderRadius: 4, border: 'none', cursor: 'pointer' }}
                              />
                              <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--th-text-sub)', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={cat.negative}
                                  onChange={e => setSchemaCategories(prev => prev.map((c, idx) => idx === i ? { ...c, negative: e.target.checked } : c))}
                                />
                                감점
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
                              <input
                                placeholder="섹션명 (한글)"
                                value={section.title}
                                onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, title: e.target.value } : s))}
                                style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--th-border)', backgroundColor: 'var(--th-card)', color: 'var(--th-text)', outline: 'none' }}
                              />
                              <input
                                placeholder="Section (English)"
                                value={section.titleEn}
                                onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, titleEn: e.target.value } : s))}
                                style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--th-border)', backgroundColor: 'var(--th-card)', color: 'var(--th-text)', outline: 'none' }}
                              />
                              <button onClick={() => setSchemaSections(prev => prev.filter((_, idx) => idx !== si))} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                            {section.categories.map((cat, ci) => (
                              <div key={cat.key} style={{ padding: '6px', borderRadius: 6, backgroundColor: 'var(--th-bg)', border: '1px solid var(--th-border)', marginBottom: 4 }}>
                                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 4 }}>
                                  <input
                                    placeholder="🎲"
                                    value={cat.icon}
                                    onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, categories: s.categories.map((c, cidx) => cidx === ci ? { ...c, icon: e.target.value } : c) } : s))}
                                    style={{ width: 28, textAlign: 'center', fontSize: 14, border: 'none', background: 'transparent', outline: 'none', color: 'var(--th-text)', flexShrink: 0 }}
                                  />
                                  <input
                                    placeholder="한글명"
                                    value={cat.label}
                                    onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, categories: s.categories.map((c, cidx) => cidx === ci ? { ...c, label: e.target.value } : c) } : s))}
                                    style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--th-border)', backgroundColor: 'var(--th-card)', color: 'var(--th-text)', outline: 'none' }}
                                  />
                                  <input
                                    placeholder="English"
                                    value={cat.labelEn}
                                    onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, categories: s.categories.map((c, cidx) => cidx === ci ? { ...c, labelEn: e.target.value } : c) } : s))}
                                    style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--th-border)', backgroundColor: 'var(--th-card)', color: 'var(--th-text)', outline: 'none' }}
                                  />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                  <input
                                    type="color"
                                    value={cat.color}
                                    onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, categories: s.categories.map((c, cidx) => cidx === ci ? { ...c, color: e.target.value } : c) } : s))}
                                    style={{ width: 22, height: 22, padding: 2, borderRadius: 4, border: 'none', cursor: 'pointer' }}
                                  />
                                  <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--th-text-sub)', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={cat.negative}
                                      onChange={e => setSchemaSections(prev => prev.map((s, idx) => idx === si ? { ...s, categories: s.categories.map((c, cidx) => cidx === ci ? { ...c, negative: e.target.checked } : c) } : s))}
                                    />
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

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-full transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
                    >
                      {isSubmitting ? t('admin', 'saving') : editingId ? t('admin', 'update') : t('admin', 'add')}
                    </button>
                    <button
                      onClick={handleCancelForm}
                      className="px-5 py-3 rounded-full border transition-colors"
                      style={{ backgroundColor: 'var(--th-card)', color: 'var(--th-text-sub)', borderColor: 'var(--th-border)' }}
                    >
                      {t('common', 'cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 게임 목록 */}
            {games.length === 0 ? (
              <div className="rounded-2xl p-8 border-2 border-dashed text-center" style={{ borderColor: 'var(--th-border)' }}>
                <p style={{ color: 'var(--th-text-sub)' }}>{t('admin', 'noGames')}</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {games.slice(gamePage * GAMES_PER_PAGE, (gamePage + 1) * GAMES_PER_PAGE).map((game) => (
                    <div
                      key={game.id}
                      className="rounded-xl p-4 border"
                      style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          {game.imageUrl ? (
                            <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl" style={{ backgroundColor: 'var(--th-bg)' }}>🎲</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate" style={{ color: 'var(--th-text)' }}>{game.name}</p>
                          <p className="text-sm" style={{ color: 'var(--th-text-sub)' }}>{game.minPlayers}~{game.maxPlayers}{t('admin', 'persons')}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => navigate(`/score-sheet/${game.id}`, {
                              state: {
                                roomId: null,
                                gameName: game.name,
                                players: [
                                  { memberId: 1, nickname: '플레이어1' },
                                  { memberId: 2, nickname: '플레이어2' },
                                  { memberId: 3, nickname: '플레이어3' },
                                ],
                                previewMode: true,
                                schemaJson: game.schemaJson ?? null,
                                backTo: '/admin',
                                backState: { returnPage: gamePage },
                              }
                            })}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#059669' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(game)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: 'var(--th-primary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(game)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#dc2626' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {games.length > GAMES_PER_PAGE && (
                  <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: Math.ceil(games.length / GAMES_PER_PAGE) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setGamePage(i)}
                        className="w-7 h-7 rounded-full text-xs font-bold transition-all"
                        style={{
                          backgroundColor: gamePage === i ? 'var(--th-primary)' : 'var(--th-card)',
                          color: gamePage === i ? '#FFFFFF' : 'var(--th-text-sub)',
                          border: '1px solid var(--th-border)',
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 멤버 관리 탭 */}
        {activeTab === 'members' && (
          <div>
            <h2 className="mb-4" style={{ color: 'var(--th-text)' }}>{t('admin', 'allMembers')} ({members.length})</h2>
            {isMembersLoading ? (
              <div className="text-center py-10" style={{ color: 'var(--th-text-sub)' }}>{t('common', 'loading')}</div>
            ) : members.length === 0 ? (
              <div className="rounded-2xl p-8 border-2 border-dashed text-center" style={{ borderColor: 'var(--th-border)' }}>
                <p style={{ color: 'var(--th-text-sub)' }}>{t('admin', 'noMembers')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.memberId || member.id}
                    className="rounded-xl p-4 border"
                    style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}
                      >
                        {member.nickname[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ color: 'var(--th-text)' }}>{member.nickname}</p>
                        {member.phoneNumber && (
                          <p className="text-sm" style={{ color: 'var(--th-text-sub)' }}>{member.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
};

export default Admin;

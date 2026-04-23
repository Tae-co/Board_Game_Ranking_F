import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Shield } from 'lucide-react';
import api, { setAccessToken } from '../api/axios';
import { clearAuthSession } from '../auth/storage';
import { useLanguage } from '../i18n/LanguageContext';

const Admin = () => {
  const navigate = useNavigate();
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
  const [gamePage, setGamePage] = useState(0);
  const GAMES_PER_PAGE = 6;

  // 멤버 관리 상태
  const [members, setMembers] = useState([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  const fetchGames = async () => {
    try {
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

  useEffect(() => {
    if (activeTab === 'members') fetchMembers();
  }, [activeTab]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { alert(t('admin', 'gameNamePlaceholder')); return; }
    if (form.minPlayers < 1 || form.maxPlayers < form.minPlayers) {
      alert(t('admin', 'saveFailed'));
      return;
    }
    setIsSubmitting(true);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const res = await api.post('/admin/upload-image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = res.data.url;
      }
      const payload = { ...form, imageUrl };
      if (editingId) {
        await api.put(`/admin/games/${editingId}`, payload);
      } else {
        await api.post('/admin/games', payload);
      }
      setForm({ name: '', minPlayers: 2, maxPlayers: 6, imageUrl: '' });
      setEditingId(null);
      setImageFile(null);
      setImagePreview('');
      setShowForm(false);
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
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (game) => {
    if (!window.confirm(`"${game.name}"${t('admin', 'deleteConfirm')}`)) return;
    try {
      await api.delete(`/admin/games/${game.id}`);
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
    setShowForm(false);
  };

  const handleLogout = () => {
    setAccessToken(null);
    clearAuthSession();
    window.location.replace('/admin-login');
  };

  const inputStyle = {
    backgroundColor: '#FFF8F0',
    borderColor: '#E5D5C0',
    color: '#2C1F0E',
  };

  const tabs = [
    { key: 'games', label: t('admin', 'gamesTab') },
    { key: 'members', label: t('admin', 'membersTab') },
    { key: 'settings', label: t('admin', 'settingsTab') },
  ];

  return (
    <div className="min-h-screen pb-8" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: '#FFF8F0' }}>

      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: '#FFF8F0' }}>
        <div className="flex items-center">
          <button
            onClick={() => navigate('/lobby')}
            className="mr-3 p-2 rounded-lg transition-colors"
            style={{ color: '#D4853A' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Shield className="w-6 h-6 mr-2" style={{ color: '#D4853A' }} />
          <h1 className="text-xl" style={{ color: '#2C1F0E' }}>{t('admin', 'title')}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-bold transition-colors"
          style={{ color: '#8B7355' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#8B7355'}
        >
          {t('common', 'logout')}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5D5C0' }}>
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex-1 py-2 px-1 rounded-lg text-xs transition-all"
              style={{
                backgroundColor: activeTab === key ? '#D4853A' : 'transparent',
                color: activeTab === key ? '#FFFFFF' : '#8B7355',
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
              <h2 style={{ color: '#2C1F0E' }}>{t('admin', 'registeredGames')} ({games.length})</h2>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-opacity"
                  style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
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
              <div className="rounded-2xl p-5 mb-5 border shadow-sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}>
                <p className="mb-4" style={{ color: '#2C1F0E' }}>{editingId ? t('admin', 'editGameTitle') : t('admin', 'addGameTitle')}</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={t('admin', 'gameNamePlaceholder')}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none"
                    style={inputStyle}
                    value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    onFocus={(e) => e.target.style.borderColor = '#D4853A'}
                    onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
                  />
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block mb-1.5 text-xs" style={{ color: '#8B7355' }}>{t('admin', 'minPlayers')}</label>
                      <input
                        type="number"
                        min={1} max={10}
                        className="w-full px-4 py-3 rounded-lg border text-center focus:outline-none"
                        style={inputStyle}
                        value={form.minPlayers}
                        onChange={(e) => setForm(p => ({ ...p, minPlayers: Number(e.target.value) }))}
                        onFocus={(e) => e.target.style.borderColor = '#D4853A'}
                        onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block mb-1.5 text-xs" style={{ color: '#8B7355' }}>{t('admin', 'maxPlayers')}</label>
                      <input
                        type="number"
                        min={1} max={10}
                        className="w-full px-4 py-3 rounded-lg border text-center focus:outline-none"
                        style={inputStyle}
                        value={form.maxPlayers}
                        onChange={(e) => setForm(p => ({ ...p, maxPlayers: Number(e.target.value) }))}
                        onFocus={(e) => e.target.style.borderColor = '#D4853A'}
                        onBlur={(e) => e.target.style.borderColor = '#E5D5C0'}
                      />
                    </div>
                  </div>

                  {/* 이미지 업로드 */}
                  <div className="space-y-2">
                    <label className="block text-xs" style={{ color: '#8B7355' }}>{t('admin', 'imageLabel')}</label>
                    <label
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border cursor-pointer transition-colors"
                      style={{ backgroundColor: '#FFF8F0', borderColor: '#E5D5C0' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#D4853A'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5D5C0'}
                    >
                      <span style={{ color: '#D4853A' }}>📁</span>
                      <span className="text-sm truncate" style={{ color: '#8B7355' }}>
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
                          style={{ borderColor: '#E5D5C0' }}
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

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-full transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
                    >
                      {isSubmitting ? t('admin', 'saving') : editingId ? t('admin', 'update') : t('admin', 'add')}
                    </button>
                    <button
                      onClick={handleCancelForm}
                      className="px-5 py-3 rounded-full border transition-colors"
                      style={{ backgroundColor: '#FFFFFF', color: '#8B7355', borderColor: '#E5D5C0' }}
                    >
                      {t('common', 'cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 게임 목록 */}
            {games.length === 0 ? (
              <div className="rounded-2xl p-8 border-2 border-dashed text-center" style={{ borderColor: '#E5D5C0' }}>
                <p style={{ color: '#8B7355' }}>{t('admin', 'noGames')}</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {games.slice(gamePage * GAMES_PER_PAGE, (gamePage + 1) * GAMES_PER_PAGE).map((game) => (
                    <div
                      key={game.id}
                      className="rounded-xl p-4 border"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          {game.imageUrl ? (
                            <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl" style={{ backgroundColor: '#FFF8F0' }}>🎲</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate" style={{ color: '#2C1F0E' }}>{game.name}</p>
                          <p className="text-sm" style={{ color: '#8B7355' }}>{game.minPlayers}~{game.maxPlayers}{t('admin', 'persons')}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(game)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#D4853A' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFF8F0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(game)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#dc2626' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFF8F0'}
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
                          backgroundColor: gamePage === i ? '#D4853A' : '#FFFFFF',
                          color: gamePage === i ? '#FFFFFF' : '#8B7355',
                          border: '1px solid #E5D5C0',
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
            <h2 className="mb-4" style={{ color: '#2C1F0E' }}>{t('admin', 'allMembers')} ({members.length})</h2>
            {isMembersLoading ? (
              <div className="text-center py-10" style={{ color: '#8B7355' }}>{t('common', 'loading')}</div>
            ) : members.length === 0 ? (
              <div className="rounded-2xl p-8 border-2 border-dashed text-center" style={{ borderColor: '#E5D5C0' }}>
                <p style={{ color: '#8B7355' }}>{t('admin', 'noMembers')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.memberId || member.id}
                    className="rounded-xl p-4 border"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D5C0' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#D4853A', color: '#FFFFFF' }}
                      >
                        {member.nickname[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ color: '#2C1F0E' }}>{member.nickname}</p>
                        {member.phoneNumber && (
                          <p className="text-sm" style={{ color: '#8B7355' }}>{member.phoneNumber}</p>
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

import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useSchemaBuilder } from '../../hooks/useSchemaBuilder';
import { useGameManagement } from '../../hooks/useGameManagement';
import AdminSchemaBuilder from './AdminSchemaBuilder';

const AdminGamesTab = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const schemaBuilder = useSchemaBuilder();
  const gm = useGameManagement(schemaBuilder, t);

  const inputStyle = {
    backgroundColor: 'var(--th-bg)',
    borderColor: 'var(--th-border)',
    color: 'var(--th-text)',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ color: 'var(--th-text)' }}>{t('admin', 'registeredGames')} ({gm.games.length})</h2>
        {!gm.showForm && (
          <button
            onClick={() => gm.setShowForm(true)}
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

      {gm.showForm && (
        <div className="rounded-2xl p-5 mb-5 border shadow-sm" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
          <p className="mb-4" style={{ color: 'var(--th-text)' }}>{gm.editingId ? t('admin', 'editGameTitle') : t('admin', 'addGameTitle')}</p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder={t('admin', 'gameNamePlaceholder')}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none"
              style={inputStyle}
              value={gm.form.name}
              onChange={(e) => gm.setForm(p => ({ ...p, name: e.target.value }))}
              onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'}
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block mb-1.5 text-xs" style={{ color: 'var(--th-text-sub)' }}>{t('admin', 'minPlayers')}</label>
                <input type="number" min={1} max={10} className="w-full px-4 py-3 rounded-lg border text-center focus:outline-none" style={inputStyle} value={gm.form.minPlayers} onChange={(e) => gm.setForm(p => ({ ...p, minPlayers: Number(e.target.value) }))} onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'} />
              </div>
              <div className="flex-1">
                <label className="block mb-1.5 text-xs" style={{ color: 'var(--th-text-sub)' }}>{t('admin', 'maxPlayers')}</label>
                <input type="number" min={1} max={10} className="w-full px-4 py-3 rounded-lg border text-center focus:outline-none" style={inputStyle} value={gm.form.maxPlayers} onChange={(e) => gm.setForm(p => ({ ...p, maxPlayers: Number(e.target.value) }))} onFocus={(e) => e.target.style.borderColor = 'var(--th-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--th-border)'} />
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div className="space-y-2">
              <label className="block text-xs" style={{ color: 'var(--th-text-sub)' }}>{t('admin', 'imageLabel')}</label>
              <label className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border cursor-pointer transition-colors" style={{ backgroundColor: 'var(--th-bg)', borderColor: 'var(--th-border)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--th-primary)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--th-border)'}>
                <span style={{ color: 'var(--th-primary)' }}>📁</span>
                <span className="text-sm truncate" style={{ color: 'var(--th-text-sub)' }}>{gm.imageFile ? gm.imageFile.name : t('admin', 'selectImage')}</span>
                <input type="file" accept="image/*" className="hidden" onChange={gm.handleImageChange} />
              </label>
              {(gm.imagePreview || gm.form.imageUrl) && (
                <div className="relative w-20 h-20">
                  <img src={gm.imagePreview || gm.form.imageUrl} alt="preview" className="w-full h-full object-cover rounded-xl border" style={{ borderColor: 'var(--th-border)' }} />
                  <button onClick={() => { gm.setForm(p => ({ ...p, imageUrl: '' })); }} className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: '#dc2626' }}>✕</button>
                </div>
              )}
            </div>

            {/* 스키마 빌더 */}
            <AdminSchemaBuilder {...schemaBuilder} />

            <div className="flex gap-3 pt-1">
              <button onClick={gm.handleSubmit} disabled={gm.isSubmitting} className="flex-1 py-3 rounded-full transition-opacity disabled:opacity-50" style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}>
                {gm.isSubmitting ? t('admin', 'saving') : gm.editingId ? t('admin', 'update') : t('admin', 'add')}
              </button>
              <button onClick={gm.handleCancelForm} className="px-5 py-3 rounded-full border transition-colors" style={{ backgroundColor: 'var(--th-card)', color: 'var(--th-text-sub)', borderColor: 'var(--th-border)' }}>
                {t('common', 'cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 게임 목록 */}
      {gm.games.length === 0 ? (
        <div className="rounded-2xl p-8 border-2 border-dashed text-center" style={{ borderColor: 'var(--th-border)' }}>
          <p style={{ color: 'var(--th-text-sub)' }}>{t('admin', 'noGames')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {gm.games.slice(gm.gamePage * gm.GAMES_PER_PAGE, (gm.gamePage + 1) * gm.GAMES_PER_PAGE).map((game) => (
              <div key={game.id} className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    {game.imageUrl ? <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl" style={{ backgroundColor: 'var(--th-bg)' }}>🎲</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ color: 'var(--th-text)' }}>{game.name}</p>
                    <p className="text-sm" style={{ color: 'var(--th-text-sub)' }}>{game.minPlayers}~{game.maxPlayers}{t('admin', 'persons')}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => navigate(`/score-sheet/${game.id}`, { state: { roomId: null, gameName: game.name, players: [{ memberId: 1, nickname: '플레이어1' }, { memberId: 2, nickname: '플레이어2' }, { memberId: 3, nickname: '플레이어3' }], previewMode: true, schemaJson: game.schemaJson ?? null, backTo: '/admin', backState: { returnPage: gm.gamePage } } })} className="p-2 rounded-lg transition-colors" style={{ color: '#059669' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-bg)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => gm.handleEdit(game)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--th-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-bg)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => gm.handleDelete(game)} className="p-2 rounded-lg transition-colors" style={{ color: '#dc2626' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-bg)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {gm.games.length > gm.GAMES_PER_PAGE && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: Math.ceil(gm.games.length / gm.GAMES_PER_PAGE) }).map((_, i) => (
                <button key={i} onClick={() => gm.setGamePage(i)} className="w-7 h-7 rounded-full text-xs font-bold transition-all" style={{ backgroundColor: gm.gamePage === i ? 'var(--th-primary)' : 'var(--th-card)', color: gm.gamePage === i ? '#FFFFFF' : 'var(--th-text-sub)', border: '1px solid var(--th-border)' }}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminGamesTab;

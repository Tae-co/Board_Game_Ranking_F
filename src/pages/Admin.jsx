import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { setAccessToken } from '../api/axios';
import { clearAuthSession } from '../auth/storage';
import { useLanguage } from '../i18n/LanguageContext';
import AdminGamesTab from '../components/admin/AdminGamesTab';
import AdminMembersTab from '../components/admin/AdminMembersTab';
import AdminStoresTab from '../components/admin/AdminStoresTab';
import AdminStatsTab from '../components/admin/AdminStatsTab';

const Admin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  // 탭·매장·하위 화면은 주소에 둔다 — 대회·이벤트 화면에 갔다가 뒤로 오면 보던 화면 그대로
  // (tab · store: 매장 탭과 통계 탭이 같은 매장 · page: 매장 탭 하위 화면 · rg: 연 신고 묶음)
  const [params, setParams] = useSearchParams();
  const update = (patch, push = false) => setParams(prev => {
    const next = new URLSearchParams(prev);
    Object.entries(patch).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, String(v))));
    return next;
  }, { replace: !push });
  const activeTab = params.get('tab') || 'games';
  const storeId = params.get('store') ? Number(params.get('store')) : null;
  const setActiveTab = (tab) => update({ tab, page: null, rg: null });
  const setStoreId = (id) => update({ store: id });
  // 하위 화면은 열 때 기록을 쌓고, 닫을 때 한 칸 뒤로 (휴대폰 뒤로 가기와 같게)
  const openPage = (page, extra = {}, push = true) => update({ page, ...extra }, push);
  const closePage = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else update({ page: null, rg: null });
  };
  // 점수판 요청(6c) → 게임 추가 폼 (이름 미리 채움)
  const [gamePrefill, setGamePrefill] = useState('');

  const handleLogout = () => {
    setAccessToken(null);
    clearAuthSession();
    window.location.replace('/login');
  };

  const tabs = [
    { key: 'games', label: t('admin', 'gamesTab') },
    { key: 'members', label: t('admin', 'membersTab') },
    { key: 'stores', label: t('admin', 'storesTab') },
    { key: 'stats', label: t('admin', 'statsTab') },
  ];

  return (
    <div className="min-h-screen pb-8" style={{ maxWidth: '375px', margin: '0 auto', backgroundColor: 'var(--th-bg)' }}>

      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: 'var(--th-nav-bg)' }}>
        <div className="flex items-center">
          <button onClick={() => navigate('/community')} className="mr-3 p-2 rounded-lg transition-colors" style={{ color: 'var(--th-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--th-card)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Shield className="w-6 h-6 mr-2" style={{ color: 'var(--th-primary)' }} />
          <h1 className="text-xl" style={{ color: 'var(--th-text)' }}>{t('admin', 'title')}</h1>
        </div>
        <button onClick={handleLogout} className="text-sm font-bold transition-colors" style={{ color: 'var(--th-text-sub)' }} onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--th-text-sub)'}>
          {t('common', 'logout')}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--th-card)', border: '1px solid var(--th-border)' }}>
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)} className="flex-1 py-2 px-1 rounded-lg text-xs transition-all" style={{ backgroundColor: activeTab === key ? 'var(--th-primary)' : 'transparent', color: activeTab === key ? '#FFFFFF' : 'var(--th-text-sub)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">
        {activeTab === 'games' && <AdminGamesTab key={gamePrefill} prefillName={gamePrefill} />}
        {activeTab === 'members' && <AdminMembersTab />}
        {activeTab === 'stores' && <AdminStoresTab selectedId={storeId} onSelect={setStoreId} page={params.get('page')} reportKey={params.get('rg')} openPage={openPage} closePage={closePage} onCreateGame={(name) => { setGamePrefill(name); setActiveTab('games'); }} />}
        {activeTab === 'stats' && <AdminStatsTab selectedId={storeId} onSelect={setStoreId} />}
      </div>
    </div>
  );
};

export default Admin;

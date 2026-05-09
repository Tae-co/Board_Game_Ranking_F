import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { setAccessToken } from '../api/axios';
import { clearAuthSession } from '../auth/storage';
import { useLanguage } from '../i18n/LanguageContext';
import AdminGamesTab from '../components/admin/AdminGamesTab';
import AdminMembersTab from '../components/admin/AdminMembersTab';

const Admin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('games');

  const handleLogout = () => {
    setAccessToken(null);
    clearAuthSession();
    window.location.replace('/admin-login');
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
        {activeTab === 'games' && <AdminGamesTab />}
        {activeTab === 'members' && <AdminMembersTab />}
      </div>
    </div>
  );
};

export default Admin;

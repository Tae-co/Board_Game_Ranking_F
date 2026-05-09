import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAdminMembers } from '../../api/services/admin';

const AdminMembersTab = () => {
  const { t } = useLanguage();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // 탭이 처음 렌더링될 때 한 번만 로드
  if (!loaded && !isLoading) {
    setIsLoading(true);
    getAdminMembers()
      .then(data => { setMembers(data || []); setLoaded(true); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }

  return (
    <div>
      <h2 className="mb-4" style={{ color: 'var(--th-text)' }}>{t('admin', 'allMembers')} ({members.length})</h2>
      {isLoading ? (
        <div className="text-center py-10" style={{ color: 'var(--th-text-sub)' }}>{t('common', 'loading')}</div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl p-8 border-2 border-dashed text-center" style={{ borderColor: 'var(--th-border)' }}>
          <p style={{ color: 'var(--th-text-sub)' }}>{t('admin', 'noMembers')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.memberId || member.id} className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--th-card)', borderColor: 'var(--th-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--th-primary)', color: '#FFFFFF' }}>
                  {member.nickname[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ color: 'var(--th-text)' }}>{member.nickname}</p>
                  {member.phoneNumber && <p className="text-sm" style={{ color: 'var(--th-text-sub)' }}>{member.phoneNumber}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMembersTab;

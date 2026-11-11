import { V } from '../../utils/cssUtils';

/** 게임방 로비의 그룹 랭킹 / 매치기록 / 시즌 탭 */
const RoomTabs = ({ activeTab, onChange, t }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', borderRadius: 24, padding: 4, backgroundColor: V('--th-card'), border: `1px solid var(--th-border)` }}>
      {[
        { key: 'group', label: t('ranking', 'groupTab') },
        { key: 'matches', label: t('ranking', 'matchesTab') },
        { key: 'season', label: t('season', 'seasonTab') },
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            flex: 1, padding: '8px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            backgroundColor: activeTab === tab.key ? V('--th-primary') : 'transparent',
            color: activeTab === tab.key ? '#fff' : V('--th-text-sub'),
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

export default RoomTabs;

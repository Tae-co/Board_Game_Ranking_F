import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAdminStoreDevices, revokeAdminStoreDevice, rotateAdminStoreQrSecret } from '../../api/services/admin';
import { V } from '../../utils/cssUtils';
import { fmt } from '../store/fmt';
import { deviceSeen } from '../store/deviceSeen';
import { ConfirmDialog } from '../store/StorePopup';
import AdminSubPage from './AdminSubPage';

const listStyle = { backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px', padding: '4px 16px' };
const dangerOutline = {
  borderRadius: 999, border: '1px solid #FECACA', backgroundColor: V('--th-card'), color: '#DC2626', fontWeight: 700, cursor: 'pointer',
};

/**
 * 6g 매장 기기 (전체 화면): 등록된 기기 목록(종류·이름·마지막 접속·위치) + 해제, QR 비밀키 새로 만들기.
 * 등록은 STAFF 폰(2l)에서만 한다.
 */
const AdminStoreDevices = ({ store, onBack }) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [dlg, setDlg] = useState(null); // { kind: 'remove', device } | { kind: 'rotate' }
  const [rotated, setRotated] = useState(false);
  const key = ['adminStoreDevices', store.id];

  const { data: devices = [] } = useQuery({
    queryKey: key,
    queryFn: () => getAdminStoreDevices(store.id),
    staleTime: 1000 * 10,
  });

  const handleConfirm = async () => {
    const current = dlg;
    setDlg(null);
    try {
      if (current.kind === 'remove') {
        queryClient.setQueryData(key, await revokeAdminStoreDevice(store.id, current.device.id));
      } else {
        await rotateAdminStoreQrSecret(store.id);
        setRotated(true);
      }
    } catch {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };

  return (
    <AdminSubPage title={t('admin', 'storeDevices')} info={t('admin', 'storeDevicesInfo')} onBack={onBack} t={t}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '13px', color: V('--th-text-sub') }}>{store.name}</span>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: V('--th-text') }}>
          {fmt(t('admin', 'storeDevicesHeading'), { place: store.branch || store.name, n: devices.length })}
        </h1>
      </section>

      <section style={listStyle}>
        {devices.length === 0 && (
          <div style={{ padding: '18px 0', fontSize: '14px', color: V('--th-text-sub') }}>{t('admin', 'storeDevicesEmpty')}</div>
        )}
        {devices.map((d, i) => {
          const tv = d.kind === 'TV';
          const seen = deviceSeen(d, t);
          return (
            <div key={d.id} style={{ minHeight: 64, display: 'flex', alignItems: 'center', gap: '12px', borderTop: i === 0 ? 'none' : `1px solid ${V('--th-border')}` }}>
              <span style={{
                width: 36, height: 36, flexShrink: 0, borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                backgroundColor: tv ? '#ECEBFF' : '#E7F6EC', color: tv ? '#4F46E5' : '#15803D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t('admin', tv ? 'deviceKindShortTv' : 'deviceKindShortTable')}
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: V('--th-text') }}>{d.name}</span>
                <span style={{ fontSize: '12px', color: seen.stale ? '#B4500A' : V('--th-text-sub') }}>
                  {t('store', tv ? 'deviceKindTv' : 'deviceKindTable')} · {seen.text}{d.lastIp ? ` · ${d.lastIp}` : ''}
                </span>
              </span>
              <button onClick={() => setDlg({ kind: 'remove', device: d })} style={{ ...dangerOutline, height: 36, padding: '0 12px', fontSize: '13px' }}>
                {t('store', 'deviceRevoke')}
              </button>
            </div>
          );
        })}
      </section>
      <span style={{ fontSize: '13px', lineHeight: 1.6, color: V('--th-text-sub') }}>{t('admin', 'storeDevicesHelp')}</span>

      <section style={{
        backgroundColor: V('--th-card'), border: `1px solid ${V('--th-border')}`, borderRadius: '20px',
        padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: V('--th-text') }}>{t('admin', 'qrLeakTitle')}</h2>
        <span style={{ fontSize: '14px', lineHeight: 1.6, color: V('--th-text-sub') }}>{t('admin', 'qrLeakDesc')}</span>
        {rotated && <span role="status" style={{ fontSize: '13px', fontWeight: 700, color: '#1F5138' }}>{t('admin', 'qrRotated')}</span>}
        <button onClick={() => setDlg({ kind: 'rotate' })} style={{ ...dangerOutline, height: 48, borderRadius: '14px', fontSize: '15px' }}>
          {t('admin', 'qrRotate')}
        </button>
      </section>

      {dlg && (
        <ConfirmDialog
          title={dlg.kind === 'rotate' ? t('admin', 'qrRotateTitle') : fmt(t('store', 'deviceRevokeTitle'), { name: dlg.device.name })}
          body={dlg.kind === 'rotate' ? t('admin', 'qrRotateBody') : t('store', 'deviceRevokeBody')}
          cancelLabel={t('common', 'cancel')}
          actionLabel={dlg.kind === 'rotate' ? t('admin', 'qrRotateDo') : t('store', 'deviceRevoke')}
          onCancel={() => setDlg(null)}
          onAction={handleConfirm}
        />
      )}
    </AdminSubPage>
  );
};

export default AdminStoreDevices;

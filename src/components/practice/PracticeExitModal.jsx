import { useLanguage } from '../../i18n/LanguageContext';
import { V } from '../../utils/cssUtils';
import ConfirmDialog, { ConfirmDesc, ConfirmNote } from '../shared/ConfirmDialog';

/**
 * 연습 중 뒤로 가기를 누르면 뜨는 종료 확인 (캔버스 Sim-S14-ExitConfirm, 다크 포함).
 * 지워지는 게 연습뿐이라 나가기 확인의 빨간 목록·버튼 대신 기본 색.
 */
const PracticeExitModal = ({ onClose, onConfirm }) => {
  const { t } = useLanguage();
  return (
    <ConfirmDialog
      title={t('practice', 'exitTitle')}
      cancelText={t('practice', 'exitContinue')}
      confirmText={t('practice', 'exitConfirm')}
      confirmColor={V('--th-primary')}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <ConfirmDesc>{t('practice', 'exitDesc')}</ConfirmDesc>
      <ConfirmNote>{t('practice', 'exitNote')}</ConfirmNote>
    </ConfirmDialog>
  );
};

export default PracticeExitModal;

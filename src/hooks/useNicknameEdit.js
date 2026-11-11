import { useEffect, useRef, useState } from 'react';
import { checkNickname, updateNickname } from '../api/services/members';
import { setNickname as persistNickname } from '../auth/storage';
import { hasOnlyAllowedNicknameChars } from '../utils/nickname';
import { V } from '../utils/cssUtils';

const CHECK_DELAY_MS = 500;

/**
 * 프로필 닉네임 바꾸기: 입력 0.5초 뒤 중복 확인, 상태 문구, 저장 가능 여부.
 * status: null | 'invalid'(허용 안 되는 글자) | 'same'(지금 닉네임) | 'checking' | 'ok' | 'taken'
 * save()는 성공하면 true, 실패하면 throw.
 */
export const useNicknameEdit = ({ userId, currentNickname, t }) => {
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const check = async (value) => {
    if (value.trim() && !hasOnlyAllowedNicknameChars(value.trim())) { setStatus('invalid'); return; }
    if (!value.trim() || value.length < 2) { setStatus(null); return; }
    if (value.trim() === currentNickname) { setStatus('same'); return; }
    setStatus('checking');
    try {
      const data = await checkNickname(value);
      setStatus(data.available ? 'ok' : 'taken');
    } catch { setStatus(null); }
  };

  const onChange = (value) => {
    setNickname(value);
    setStatus(null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => check(value), CHECK_DELAY_MS);
  };

  const trimmed = nickname.trim();
  const canSave = trimmed.length >= 2
    && trimmed !== currentNickname
    && status !== 'taken'
    && status !== 'checking'
    && hasOnlyAllowedNicknameChars(trimmed);

  /** 저장할 수 없는 상태면 아무것도 안 하고 false */
  const save = async () => {
    if (trimmed === currentNickname) return false;
    if (!trimmed || nickname.length < 2) return false;
    if (status === 'taken') return false;
    if (!hasOnlyAllowedNicknameChars(trimmed)) return false;
    setIsSaving(true);
    try {
      await updateNickname(userId, trimmed);
      persistNickname(trimmed);
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const HINTS = {
    same: { text: t('profile', 'nicknameIsSame'), color: V('--th-text-sub') },
    checking: { text: t('profile', 'nicknameChecking'), color: V('--th-text-sub') },
    ok: { text: t('profile', 'nicknameAvailable'), color: '#16a34a' },
    taken: { text: t('profile', 'nicknameTaken'), color: '#dc2626' },
    invalid: { text: t('profile', 'nicknameInvalidChars'), color: '#dc2626' },
  };

  return { nickname, onChange, status, hint: HINTS[status] ?? null, canSave, isSaving, save };
};

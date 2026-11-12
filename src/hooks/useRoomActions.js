import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useApiErrorMessage } from './useApiErrorMessage';
import { joinRoom, leaveRoom, deleteRoom, kickRoomMember, updateRoomName, updateMemberRating, updateCurrentSeason } from '../api/services/rooms';

/** LP 입력값: 비어 있지 않은 0 이상의 숫자. 모달의 저장 버튼도 같은 기준으로 막는다. */
export const isValidRating = (value) => String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;

const removeRoomFrom = (roomId) => (old) =>
  Array.isArray(old) ? old.filter(r => String(r.roomId) !== String(roomId)) : old;

/**
 * 게임방 로비의 방·멤버 관리 (참가, 나가기, 삭제, 강퇴, 이름 변경, LP 수정, 시즌 수정).
 * 서버 요청 후 react-query 캐시를 직접 고쳐 목록 화면들이 다시 불러오지 않게 한다.
 */
export const useRoomActions = ({ roomId, userId, roomName, inviteCode, t }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const errorText = useApiErrorMessage();

  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editRoomName, setEditRoomName] = useState('');
  const [saving, setSaving] = useState(false);
  const [ratingEditModal, setRatingEditModal] = useState(null);
  const [ratingEditValue, setRatingEditValue] = useState('');
  const [isRatingEditSaving, setIsRatingEditSaving] = useState(false);

  const handleJoinRoom = async () => {
    setIsJoiningRoom(true);
    try {
      await joinRoom(inviteCode);
      queryClient.invalidateQueries({ queryKey: ['roomMembers', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['communityRooms'] });
    } catch { alert(t('invite', 'joinFailed')); }
    setIsJoiningRoom(false);
  };

  // 팝업의 나가기. 실패하면 팝업이 서버 문구를 보여 주도록 그대로 던진다.
  const confirmLeaveRoom = async () => {
    await leaveRoom(roomId, userId);
    queryClient.setQueriesData({ queryKey: ['rooms'] }, removeRoomFrom(roomId));
    // 커뮤니티 방은 나가도 목록에 남아야 다시 참가할 수 있다.
    queryClient.invalidateQueries({ queryKey: ['communityRooms'] });
    // 다시 들어왔을 때 캐시된 목록에 내가 멤버로 남아 있지 않도록 비운다.
    queryClient.removeQueries({ queryKey: ['roomMembers', roomId] });
    queryClient.removeQueries({ queryKey: ['rankings', roomId] });
    navigate('/lobby');
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm(t('invite', 'deleteConfirm'))) return;
    try {
      await deleteRoom(roomId);
      queryClient.setQueriesData({ queryKey: ['rooms'] }, removeRoomFrom(roomId));
      queryClient.setQueriesData({ queryKey: ['communityRooms'] }, removeRoomFrom(roomId));
      navigate('/lobby');
    } catch { alert(t('invite', 'deleteFailed')); }
  };

  const handleKickMember = async (member) => {
    if (!window.confirm(`${member.nickname}${t('invite', 'kickConfirm')}`)) return;
    try {
      await kickRoomMember(roomId, member.memberId);
      queryClient.setQueryData(['roomMembers', roomId], (old) =>
        Array.isArray(old) ? old.filter(m => m.memberId !== member.memberId) : old
      );
    } catch { alert(t('invite', 'kickFailed')); }
  };

  const openSettings = () => { setEditRoomName(roomName); setShowSettings(true); };

  const handleSaveSettings = async () => {
    const trimmed = editRoomName.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await updateRoomName(roomId, trimmed);
      const updateName = (old) =>
        Array.isArray(old)
          ? old.map(r => String(r.roomId) === String(roomId) ? { ...r, roomName: trimmed } : r)
          : old;
      queryClient.setQueryData(['room', roomId], (old) => old ? { ...old, roomName: trimmed } : old);
      queryClient.setQueriesData({ queryKey: ['rooms'] }, updateName);
      queryClient.setQueriesData({ queryKey: ['communityRooms'] }, updateName);
      setShowSettings(false);
    } catch { alert(t('invite', 'renameFailed')); }
    setSaving(false);
  };

  const handleSaveSeason = async (payload) => {
    const updated = await updateCurrentSeason(roomId, payload);
    queryClient.setQueryData(['currentSeason', roomId], updated);
  };

  const handleOpenRatingEdit = useCallback((rank) => {
    setRatingEditModal(rank);
    setRatingEditValue(String(Math.round(rank.rating)));
  }, []);

  const handleUpdateRating = async () => {
    if (!ratingEditModal) return;
    const val = Number(ratingEditValue);
    if (!isValidRating(ratingEditValue)) return;
    setIsRatingEditSaving(true);
    try {
      await updateMemberRating(roomId, ratingEditModal.memberId, { rating: val });
      queryClient.invalidateQueries({ queryKey: ['rankings', roomId] });
      setRatingEditModal(null);
    } catch (err) { alert(errorText(err, t('ranking', 'editRatingFailed'))); }
    finally { setIsRatingEditSaving(false); }
  };

  return {
    isJoiningRoom, handleJoinRoom,
    confirmLeaveRoom, handleDeleteRoom, handleKickMember,
    showSettings, setShowSettings, openSettings, editRoomName, setEditRoomName, saving, handleSaveSettings,
    handleSaveSeason,
    ratingEditModal, setRatingEditModal, ratingEditValue, setRatingEditValue, isRatingEditSaving,
    handleOpenRatingEdit, handleUpdateRating,
  };
};

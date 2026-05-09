import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAccessToken } from '../api/axios';
import { getAdminGames, createAdminGame, updateAdminGame, deleteAdminGame } from '../api/services/admin';

const GAMES_PER_PAGE = 6;

export const useGameManagement = ({ buildSchemaJson, validateSchemaUI, resetSchema, loadFromGame }, t) => {
  const location = useLocation();
  const [games, setGames] = useState([]);
  const [form, setForm] = useState({ name: '', minPlayers: 2, maxPlayers: 6, imageUrl: '' });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [gamePage, setGamePage] = useState(location.state?.returnPage ?? 0);

  const fetchGames = async () => {
    try {
      const data = await getAdminGames();
      setGames(data);
    } catch {
      alert(t('admin', 'loadFailed'));
    }
  };

  useEffect(() => { fetchGames(); }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) { alert(t('admin', 'gameNamePlaceholder')); return; }
    if (form.minPlayers < 1 || form.maxPlayers < form.minPlayers) {
      alert(t('admin', 'saveFailed'));
      return;
    }
    const schemaError = validateSchemaUI();
    if (schemaError) { alert(schemaError); return; }

    setIsSubmitting(true);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const token = getAccessToken();
        const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/upload-image`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }
      const schemaJson = buildSchemaJson(form.name);
      const payload = { ...form, imageUrl, schemaJson };
      if (editingId) {
        await updateAdminGame(editingId, payload);
      } else {
        await createAdminGame(payload);
      }
      setForm({ name: '', minPlayers: 2, maxPlayers: 6, imageUrl: '' });
      setEditingId(null);
      setImageFile(null);
      setImagePreview('');
      resetSchema();
      setShowForm(false);
      setGamePage(0);
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
    loadFromGame(game);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (game) => {
    if (!window.confirm(`"${game.name}"${t('admin', 'deleteConfirm')}`)) return;
    try {
      await deleteAdminGame(game.id);
      setGamePage(0);
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
    resetSchema();
    setShowForm(false);
    setGamePage(0);
  };

  return {
    games, form, setForm, editingId, isSubmitting,
    imageFile, imagePreview, showForm, setShowForm,
    gamePage, setGamePage, GAMES_PER_PAGE,
    fetchGames, handleSubmit, handleImageChange,
    handleEdit, handleDelete, handleCancelForm,
  };
};

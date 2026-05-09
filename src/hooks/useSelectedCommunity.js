import { useState, useEffect } from 'react';
import {
  getSelectedCommunity,
  setSelectedCommunity as saveSelectedCommunity,
  removeSelectedCommunity,
  SELECTED_COMMUNITY_UPDATED_EVENT,
} from '../utils/storage';

export const useSelectedCommunity = () => {
  const [selectedCommunity, setSelectedCommunity] = useState(() => getSelectedCommunity());

  useEffect(() => {
    const handler = () => setSelectedCommunity(getSelectedCommunity());
    window.addEventListener(SELECTED_COMMUNITY_UPDATED_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(SELECTED_COMMUNITY_UPDATED_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const update = (community) => {
    saveSelectedCommunity(community);
    setSelectedCommunity(community);
  };

  const remove = () => {
    removeSelectedCommunity();
    setSelectedCommunity(null);
  };

  return { selectedCommunity, setSelectedCommunity: update, removeSelectedCommunity: remove };
};

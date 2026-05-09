import api from '../axios';

export const getGames = () => api.get('/games').then(r => r.data);

import api from './api';
 
// Kullanıcının verdiği teklifleri getir
export const getUserBids = async () => {
  const response = await api.get('/listings/user/mybids');
  return response.data;
}; 
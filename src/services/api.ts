import axios from 'axios';

// Create axios instance with default config
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (expired or invalid token)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optional: redirect to login page or trigger auth error event
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  updateProfile: async (profileData: any) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/auth/stats');
    return response.data;
  },
};

// Transit API
export const transitAPI = {
  getLines: async () => {
    const response = await api.get('/transit/lines');
    return response.data;
  },
  getLineDetails: async (lineId: string) => {
    const response = await api.get(`/transit/lines/${lineId}`);
    return response.data;
  },
  rateLine: async (lineId: string, ratingData: any) => {
    const response = await api.post(`/transit/lines/${lineId}/rate`, ratingData);
    return response.data;
  },
  recordTrip: async (tripData: any) => {
    const response = await api.post('/transit/trips', tripData);
    return response.data;
  },
  getUserTrips: async () => {
    const response = await api.get('/transit/trips');
    return response.data;
  },
};

// Rewards API
export const rewardsAPI = {
  getRewards: async () => {
    const response = await api.get('/rewards');
    return response.data;
  },
  redeemReward: async (rewardId: string) => {
    const response = await api.post(`/rewards/${rewardId}/redeem`);
    return response.data;
  },
  getUserRewards: async () => {
    const response = await api.get('/rewards/user');
    return response.data;
  },
};

// Social API
export const socialAPI = {
  // Friends
  getFriends: async () => {
    const response = await api.get('/social/friends');
    return response.data;
  },
  sendFriendRequest: async (targetUserId: number) => {
    const response = await api.post('/social/friends/request', { targetUserId });
    return response.data;
  },
  getFriendRequests: async () => {
    const response = await api.get('/social/friends/requests');
    return response.data;
  },
  acceptFriendRequest: async (requestId: number) => {
    const response = await api.post(`/social/friends/accept/${requestId}`);
    return response.data;
  },
  rejectFriendRequest: async (requestId: number) => {
    const response = await api.post(`/social/friends/reject/${requestId}`);
    return response.data;
  },
  removeFriend: async (friendId: number) => {
    const response = await api.delete(`/social/friends/${friendId}`);
    return response.data;
  },

  // Groups
  createGroup: async (groupData: { name: string; description: string; icon: string }) => {
    const response = await api.post('/social/groups', groupData);
    return response.data;
  },
  getGroups: async () => {
    const response = await api.get('/social/groups');
    return response.data;
  },
  getGroup: async (groupId: number) => {
    const response = await api.get(`/social/groups/${groupId}`);
    return response.data;
  },
  joinGroup: async (groupId: number) => {
    const response = await api.post(`/social/groups/${groupId}/join`);
    return response.data;
  },
  leaveGroup: async (groupId: number) => {
    const response = await api.delete(`/social/groups/${groupId}/leave`);
    return response.data;
  },

  // Posts
  createPost: async (postData: { content: string; image?: string; type?: string }) => {
    const response = await api.post('/social/posts', postData);
    return response.data;
  },
  getFeed: async (limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const response = await api.get(`/social/posts/feed?${params}`);
    return response.data;
  },
  getUserPosts: async (userId: number, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const response = await api.get(`/social/posts/user/${userId}?${params}`);
    return response.data;
  },
  toggleLike: async (postId: number) => {
    const response = await api.post(`/social/posts/${postId}/like`);
    return response.data;
  },
  addComment: async (postId: number, content: string) => {
    const response = await api.post(`/social/posts/${postId}/comments`, { content });
    return response.data;
  },
  getComments: async (postId: number, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const response = await api.get(`/social/posts/${postId}/comments?${params}`);
    return response.data;
  },

  // Messages
  sendGroupMessage: async (groupId: number, content: string, type?: string) => {
    const response = await api.post(`/social/messages/groups/${groupId}`, { content, type });
    return response.data;
  },
  sendDirectMessage: async (recipientId: number, content: string, type?: string) => {
    const response = await api.post(`/social/messages/direct/${recipientId}`, { content, type });
    return response.data;
  },
  getGroupMessages: async (groupId: number, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const response = await api.get(`/social/messages/groups/${groupId}?${params}`);
    return response.data;
  },
  getDirectMessages: async (userId: number, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const response = await api.get(`/social/messages/direct/${userId}?${params}`);
    return response.data;
  },
  getConversations: async (limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    const response = await api.get(`/social/conversations?${params}`);
    return response.data;
  },
};

// Premium API
export const premiumAPI = {
  upgrade: async (paymentDetails: any) => {
    const response = await api.post('/premium/upgrade', paymentDetails);
    return response.data;
  },
  cancel: async () => {
    const response = await api.post('/premium/cancel');
    return response.data;
  },
  getStatus: async () => {
    const response = await api.get('/premium/status');
    return response.data;
  },
};

export default api;

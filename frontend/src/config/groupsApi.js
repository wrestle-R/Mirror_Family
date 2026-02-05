import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawBase.replace(/\/+$/g, '').endsWith('/api')
  ? rawBase.replace(/\/+$/g, '')
  : rawBase.replace(/\/+$/g, '') + '/api';

const groupsApi = {
  // Create a new group
  createGroup: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/groups`, data);
    return response.data;
  },

  // Get all groups for a user
  getUserGroups: async (firebaseUid) => {
    const response = await axios.get(`${API_BASE_URL}/groups/${firebaseUid}`);
    return response.data;
  },

  // Get group details
  getGroupDetails: async (groupId) => {
    const response = await axios.get(`${API_BASE_URL}/groups/details/${groupId}`);
    return response.data;
  },

  // Update group
  updateGroup: async (groupId, data) => {
    const response = await axios.put(`${API_BASE_URL}/groups/${groupId}`, data);
    return response.data;
  },

  // Delete group
  deleteGroup: async (groupId, firebaseUid) => {
    const response = await axios.delete(`${API_BASE_URL}/groups/${groupId}`, {
      data: { firebaseUid }
    });
    return response.data;
  },

  // Join group by invite code
  joinGroup: async (inviteCode, firebaseUid) => {
    const response = await axios.post(`${API_BASE_URL}/groups/join`, {
      inviteCode,
      firebaseUid
    });
    return response.data;
  },

  // Remove member from group
  removeMember: async (groupId, memberId, firebaseUid) => {
    const response = await axios.post(
      `${API_BASE_URL}/groups/${groupId}/members/${memberId}/remove`,
      { firebaseUid }
    );
    return response.data;
  },

  // Leave group
  leaveGroup: async (groupId, firebaseUid) => {
    const response = await axios.post(`${API_BASE_URL}/groups/${groupId}/leave`, {
      firebaseUid
    });
    return response.data;
  },

  // Create expense
  createExpense: async (groupId, data) => {
    const response = await axios.post(`${API_BASE_URL}/groups/${groupId}/expenses`, data);
    return response.data;
  },

  // Get group expenses
  getGroupExpenses: async (groupId) => {
    const response = await axios.get(`${API_BASE_URL}/groups/${groupId}/expenses`);
    return response.data;
  },

  // Update expense
  updateExpense: async (groupId, expenseId, data) => {
    const response = await axios.put(
      `${API_BASE_URL}/groups/${groupId}/expenses/${expenseId}`,
      data
    );
    return response.data;
  },

  // Delete expense
  deleteExpense: async (groupId, expenseId, firebaseUid) => {
    const response = await axios.delete(
      `${API_BASE_URL}/groups/${groupId}/expenses/${expenseId}`,
      { data: { firebaseUid } }
    );
    return response.data;
  },

  // Get group balances
  getGroupBalances: async (groupId) => {
    const response = await axios.get(`${API_BASE_URL}/groups/${groupId}/balances`);
    return response.data;
  },

  // Settle expense
  settleExpense: async (groupId, expenseId) => {
    const response = await axios.post(`${API_BASE_URL}/groups/${groupId}/expenses/${expenseId}/settle`);
    return response.data;
  },

  // Settle balance between two members
  settleBalance: async (groupId, settlementData) => {
    const response = await axios.post(`${API_BASE_URL}/groups/${groupId}/settle`, settlementData);
    return response.data;
  },

  // Get group analytics
  getGroupAnalytics: async (groupId) => {
    const response = await axios.get(`${API_BASE_URL}/groups/${groupId}/analytics`);
    return response.data;
  },
  // Get group transactions
  getGroupTransactions: async (groupId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/groups/${groupId}/transactions${query ? `?${query}` : ''}`;
    const response = await axios.get(url);
    return response.data;
  },
  // Settle all simplified settlements (owner can settle all; others settle only their own outgoing settlements)
  settleAll: async (groupId, data = {}) => {
    const response = await axios.post(`${API_BASE_URL}/groups/${groupId}/settle-all`, data);
    return response.data;
  },
};

export default groupsApi;

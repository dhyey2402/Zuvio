import { apiClient } from '../lib/axios';

export const shareService = {
  // --- Internal Sharing ---
  
  // Create a share
  createShare: async ({ fileId, folderId, recipientEmail, role }) => {
    const payload = { role, recipient_email: recipientEmail };
    if (fileId) payload.file_id = fileId;
    if (folderId) payload.folder_id = folderId;
    
    const response = await apiClient.post('/shares', payload);
    return response.data;
  },

  // List shares for a resource
  listShares: async (resourceId, resourceType) => {
    const response = await apiClient.get(`/shares/${resourceId}`, {
      params: { resource_type: resourceType }
    });
    return response.data;
  },

  // Update a share role
  updateShare: async (shareId, role) => {
    const response = await apiClient.patch(`/shares/${shareId}`, { role });
    return response.data;
  },

  // Remove a share
  removeShare: async (shareId) => {
    const response = await apiClient.delete(`/shares/${shareId}`);
    return response.data;
  },

  // --- Public Links ---
  
  // Create a public link
  createPublicLink: async ({ fileId, folderId, role, expiresInDays, password }) => {
    const payload = { role };
    if (fileId) payload.file_id = fileId;
    if (folderId) payload.folder_id = folderId;
    if (expiresInDays) payload.expires_in_days = expiresInDays;
    if (password) payload.password = password;
    
    const response = await apiClient.post('/public-links', payload);
    return response.data;
  },

  // Revoke a public link
  revokePublicLink: async (token) => {
    const response = await apiClient.delete(`/public-links/${token}`);
    return response.data;
  }
};

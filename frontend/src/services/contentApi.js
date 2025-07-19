/**
 * Content Management API Service
 * Handles all content-related API calls for admin editing
 */
import { api } from './api';

export const contentApi = {
  // Node Content Operations
  getAllNodeContent: async (page = 1, perPage = 20, nodeType = null, search = null) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    if (nodeType) params.append('node_type', nodeType);
    if (search) params.append('search', search);
    
    return await api.get(`/content/nodes?${params.toString()}`);
  },

  getNodeContent: async (nodeId) => {
    return await api.get(`/content/nodes/${nodeId}`);
  },

  updateNodeContent: async (nodeId, contentUpdate) => {
    return await api.put(`/content/nodes/${nodeId}`, contentUpdate);
  },

  // Preview System
  createPreview: async (nodeId, previewRequest) => {
    return await api.post(`/content/nodes/${nodeId}/preview`, previewRequest);
  },

  getPreview: async (nodeId, previewId) => {
    return await api.get(`/content/nodes/${nodeId}/preview/${previewId}`);
  },

  publishPreview: async (previewId, publishRequest) => {
    return await api.post(`/content/previews/${previewId}/publish`, publishRequest);
  },

  discardPreview: async (previewId) => {
    return await api.delete(`/content/previews/${previewId}`);
  },

  // File Upload
  uploadFile: async (file, contentType = 'image') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('content_type', contentType);

    return await api.post('/content/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  getFile: async (fileId) => {
    return `/content/files/${fileId}`;
  },

  // Version History
  getContentVersions: async (nodeId, page = 1, perPage = 10) => {
    return await api.get(`/content/nodes/${nodeId}/versions?page=${page}&per_page=${perPage}`);
  },

  revertToVersion: async (nodeId, versionNumber) => {
    return await api.post(`/content/nodes/${nodeId}/revert/${versionNumber}`);
  },

  // Real-time Notifications
  getContentNotifications: async (since = null, limit = 50) => {
    const params = new URLSearchParams({
      limit: limit.toString()
    });
    
    if (since) {
      params.append('since', since.toISOString());
    }
    
    return await api.get(`/content/notifications?${params.toString()}`);
  },

  // Content Templates
  getContentTemplates: async () => {
    return await api.get('/content/templates');
  },

  createContentFromTemplate: async (nodeId, templateId, customization = {}) => {
    return await api.post('/content/templates/apply', {
      node_id: nodeId,
      template_id: templateId,
      customization
    });
  },

  // Content Statistics
  getContentStats: async (contentId) => {
    return await api.get(`/content/stats/${contentId}`);
  },

  // Bulk Operations
  bulkUpdateContent: async (updates) => {
    return await api.post('/content/bulk-update', { updates });
  },

  bulkPublishPreviews: async (previewIds, publishRequest) => {
    return await api.post('/content/bulk-publish', {
      preview_ids: previewIds,
      publish_request: publishRequest
    });
  }
};

export default contentApi;
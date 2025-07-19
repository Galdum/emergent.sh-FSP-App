import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          // Don't redirect here, let components handle it
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.Authorization;
    }
  }

  clearAuthToken() {
    delete this.client.defaults.headers.Authorization;
  }

  // Generic HTTP methods
  async get(endpoint, config = {}) {
    const response = await this.client.get(endpoint, config);
    return response.data;
  }

  async post(endpoint, data, config = {}) {
    const response = await this.client.post(endpoint, data, config);
    return response.data;
  }

  async put(endpoint, data, config = {}) {
    const response = await this.client.put(endpoint, data, config);
    return response.data;
  }

  async patch(endpoint, data, config = {}) {
    const response = await this.client.patch(endpoint, data, config);
    return response.data;
  }

  async delete(endpoint, config = {}) {
    const response = await this.client.delete(endpoint, config);
    return response.data;
  }

  async register(email, password) {
    const response = await this.client.post('/auth/register', { email, password });
    return response.data;
  }

  async login(email, password) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Progress endpoints
  async getProgress() {
    const response = await this.client.get('/progress');
    return response.data;
  }

  async updateProgress(stepId, taskId, completed, viewed = true) {
    const response = await this.client.put('/progress', {
      step_id: stepId,
      task_id: taskId,
      completed,
      viewed
    });
    return response.data;
  }

  async syncProgress(progressData) {
    const response = await this.client.post('/progress/sync', progressData);
    return response.data;
  }

  // Personal files endpoints
  async getFiles() {
    const response = await this.client.get('/files');
    return response.data;
  }

  async createFile(fileData) {
    const response = await this.client.post('/files', fileData);
    return response.data;
  }

  async updateFile(fileId, fileData) {
    const response = await this.client.put(`/files/${fileId}`, fileData);
    return response.data;
  }

  async deleteFile(fileId) {
    const response = await this.client.delete(`/files/${fileId}`);
    return response.data;
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async syncFiles(filesData) {
    const response = await this.client.post('/files/sync', filesData);
    return response.data;
  }

  // Subscription endpoints
  async getSubscription() {
    const response = await this.client.get('/subscription');
    return response.data;
  }

  async updateSubscription(tier) {
    const response = await this.client.post('/subscription/test-upgrade/', tier, {
      params: { tier }
    });
    return response.data;
  }

  // Billing endpoints
  async createCheckoutSession(subscriptionPlan) {
    const response = await this.client.post('/billing/checkout', {
      subscription_plan: subscriptionPlan
    });
    return response.data;
  }

  async getPaymentStatus(sessionId) {
    const response = await this.client.get(`/billing/payment-status/${sessionId}`);
    return response.data;
  }

  async getBillingPlans() {
    const response = await this.client.get('/billing/plans');
    return response.data;
  }

  async getUserTransactions() {
    const response = await this.client.get('/billing/transactions');
    return response.data;
  }

  // Admin endpoints
  async getAdminStats() {
    const response = await this.client.get('/admin/stats');
    return response.data;
  }

  async getAdminUsers(skip = 0, limit = 50, search = null) {
    const params = { skip, limit };
    if (search) params.search = search;
    const response = await this.client.get('/admin/users', { params });
    return response.data;
  }

  async getAdminTransactions(skip = 0, limit = 100, statusFilter = null) {
    const params = { skip, limit };
    if (statusFilter) params.status_filter = statusFilter;
    const response = await this.client.get('/admin/transactions', { params });
    return response.data;
  }

  async getAdminErrors(skip = 0, limit = 100, resolved = null) {
    const params = { skip, limit };
    if (resolved !== null) params.resolved = resolved;
    const response = await this.client.get('/admin/errors', { params });
    return response.data;
  }

  async resolveError(errorId) {
    const response = await this.client.patch(`/admin/errors/${errorId}/resolve`);
    return response.data;
  }

  async deleteUser(userId) {
    const response = await this.client.delete(`/admin/users/${userId}`);
    return response.data;
  }

  async updateUserSubscription(userId, subscriptionData) {
    const response = await this.client.patch(`/admin/users/${userId}/subscription`, subscriptionData);
    return response.data;
  }

  // Monitoring endpoints
  async reportError(errorData) {
    const response = await this.client.post('/monitoring/report-error', errorData);
    return response.data;
  }

  async submitFeedback(feedbackData) {
    const response = await this.client.post('/monitoring/feedback', feedbackData);
    return response.data;
  }

  async getAppHealth() {
    const response = await this.client.get('/monitoring/health');
    return response.data;
  }

  async getUserMetrics() {
    const response = await this.client.get('/monitoring/metrics');
    return response.data;
  }

  async logUserAction(actionData) {
    const response = await this.client.post('/monitoring/log-action', actionData);
    return response.data;
  }

  async getUserNotifications() {
    const response = await this.client.get('/monitoring/notifications');
    return response.data;
  }

  // Deployment endpoints
  async getVersionInfo() {
    const response = await this.client.get('/deployment/version');
    return response.data;
  }

  async getDeploymentStatus() {
    const response = await this.client.get('/deployment/status');
    return response.data;
  }

  async getFeatureFlags() {
    const response = await this.client.get('/deployment/feature-flags');
    return response.data;
  }

  async exportUserData() {
    const response = await this.client.get('/deployment/export-data');
    return response.data;
  }

  async deleteUserAccount() {
    const response = await this.client.delete('/deployment/delete-account');
    return response.data;
  }

  // Backup endpoints (admin only)
  async getBackupStatus() {
    const response = await this.client.get('/backup/status');
    return response.data;
  }

  async createDatabaseBackup() {
    const response = await this.client.post('/backup/database');
    return response.data;
  }

  async createFilesBackup() {
    const response = await this.client.post('/backup/files');
    return response.data;
  }
}

export const api = new ApiService();
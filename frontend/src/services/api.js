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

  // Authentication endpoints
  async register(email, password) {
    const response = await this.client.post('/auth/register/', { email, password });
    return response.data;
  }

  async login(email, password) {
    const response = await this.client.post('/auth/login/', { email, password });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me/');
    return response.data;
  }

  // Progress endpoints
  async getProgress() {
    const response = await this.client.get('/progress/');
    return response.data;
  }

  async updateProgress(stepId, taskId, completed, viewed = true) {
    const response = await this.client.put('/progress/', {
      step_id: stepId,
      task_id: taskId,
      completed,
      viewed
    });
    return response.data;
  }

  async syncProgress(progressData) {
    const response = await this.client.post('/progress/sync/', progressData);
    return response.data;
  }

  // Personal files endpoints
  async getFiles() {
    const response = await this.client.get('/files/');
    return response.data;
  }

  async createFile(fileData) {
    const response = await this.client.post('/files/', fileData);
    return response.data;
  }

  async updateFile(fileId, fileData) {
    const response = await this.client.put(`/files/${fileId}/`, fileData);
    return response.data;
  }

  async deleteFile(fileId) {
    const response = await this.client.delete(`/files/${fileId}/`);
    return response.data;
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/files/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async syncFiles(filesData) {
    const response = await this.client.post('/files/sync/', filesData);
    return response.data;
  }

  // Subscription endpoints
  async getSubscription() {
    const response = await this.client.get('/subscription/');
    return response.data;
  }

  async updateSubscription(tier) {
    const response = await this.client.post('/subscription/test-upgrade/', tier, {
      params: { tier }
    });
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health/');
    return response.data;
  }
}

export const api = new ApiService();
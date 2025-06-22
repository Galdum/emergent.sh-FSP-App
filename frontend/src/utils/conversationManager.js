/**
 * Conversation Manager for cost-effective AI interactions
 * Handles conversation history, compression, and cost optimization
 */

const STORAGE_KEY = 'ai_conversations';
const MAX_CONVERSATION_LENGTH = 10; // Maximum messages to keep in active memory
const COMPRESSION_THRESHOLD = 20; // Compress when conversation exceeds this length

/**
 * Conversation storage and retrieval
 */
export class ConversationManager {
  constructor() {
    this.conversations = this.loadConversations();
    this.currentConversationId = null;
  }

  /**
   * Load conversations from localStorage
   */
  loadConversations() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading conversations:', error);
      return {};
    }
  }

  /**
   * Save conversations to localStorage
   */
  saveConversations() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.conversations));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }

  /**
   * Start a new conversation
   */
  startNewConversation(type = 'assistant') {
    const conversationId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentConversationId = conversationId;
    
    this.conversations[conversationId] = {
      id: conversationId,
      type: type,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      messages: [],
      compressed: [],
      context: '',
      totalTokensEstimate: 0
    };
    
    this.saveConversations();
    return conversationId;
  }

  /**
   * Add message to current conversation
   */
  addMessage(role, content) {
    if (!this.currentConversationId) {
      this.startNewConversation();
    }

    const conversation = this.conversations[this.currentConversationId];
    const message = {
      role: role,
      parts: [{ text: content }],
      timestamp: new Date().toISOString(),
      tokens: this.estimateTokens(content)
    };

    conversation.messages.push(message);
    conversation.lastUpdated = new Date().toISOString();
    conversation.totalTokensEstimate += message.tokens;

    // Check if compression is needed
    if (conversation.messages.length > COMPRESSION_THRESHOLD) {
      this.compressConversation(this.currentConversationId);
    }

    this.saveConversations();
    return message;
  }

  /**
   * Get conversation history optimized for API calls
   */
  getOptimizedHistory(conversationId = null) {
    const id = conversationId || this.currentConversationId;
    if (!id || !this.conversations[id]) return [];

    const conversation = this.conversations[id];
    
    // Return compressed context + recent messages
    const recentMessages = conversation.messages.slice(-MAX_CONVERSATION_LENGTH);
    
    // If we have compressed history, include it as context
    if (conversation.context) {
      return [
        {
          role: 'user',
          parts: [{ text: `Contextul conversației precedente: ${conversation.context}` }]
        },
        ...recentMessages
      ];
    }

    return recentMessages;
  }

  /**
   * Compress old conversation to save space and tokens
   */
  compressConversation(conversationId) {
    const conversation = this.conversations[conversationId];
    if (!conversation || conversation.messages.length <= MAX_CONVERSATION_LENGTH) return;

    // Take older messages for compression
    const messagesToCompress = conversation.messages.slice(0, -MAX_CONVERSATION_LENGTH);
    const keepMessages = conversation.messages.slice(-MAX_CONVERSATION_LENGTH);

    // Create a summary of compressed messages
    const summary = this.createConversationSummary(messagesToCompress);
    
    // Update conversation
    conversation.context = summary;
    conversation.messages = keepMessages;
    conversation.compressed.push({
      timestamp: new Date().toISOString(),
      messageCount: messagesToCompress.length,
      summary: summary
    });

    this.saveConversations();
  }

  /**
   * Create a summary of messages for compression
   */
  createConversationSummary(messages) {
    const userQuestions = [];
    const aiResponses = [];

    messages.forEach(msg => {
      if (msg.role === 'user') {
        userQuestions.push(msg.parts[0].text.substring(0, 100));
      } else if (msg.role === 'model') {
        aiResponses.push(msg.parts[0].text.substring(0, 150));
      }
    });

    return `Întrebări utilizator: ${userQuestions.join('; ')}. Răspunsuri anterioare: ${aiResponses.join('; ')}.`;
  }

  /**
   * Estimate token count for cost calculation
   */
  estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters for Romanian text
    return Math.ceil(text.length / 4);
  }

  /**
   * Get conversation statistics
   */
  getConversationStats(conversationId = null) {
    const id = conversationId || this.currentConversationId;
    if (!id || !this.conversations[id]) return null;

    const conversation = this.conversations[id];
    return {
      id: id,
      messageCount: conversation.messages.length,
      compressedSessions: conversation.compressed.length,
      estimatedTokens: conversation.totalTokensEstimate,
      created: conversation.created,
      lastUpdated: conversation.lastUpdated
    };
  }

  /**
   * List all conversations
   */
  listConversations() {
    return Object.values(this.conversations)
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      .map(conv => ({
        id: conv.id,
        type: conv.type,
        created: conv.created,
        lastUpdated: conv.lastUpdated,
        messageCount: conv.messages.length,
        estimatedTokens: conv.totalTokensEstimate
      }));
  }

  /**
   * Load specific conversation
   */
  loadConversation(conversationId) {
    if (this.conversations[conversationId]) {
      this.currentConversationId = conversationId;
      return this.conversations[conversationId];
    }
    return null;
  }

  /**
   * Delete conversation
   */
  deleteConversation(conversationId) {
    if (this.conversations[conversationId]) {
      delete this.conversations[conversationId];
      if (this.currentConversationId === conversationId) {
        this.currentConversationId = null;
      }
      this.saveConversations();
      return true;
    }
    return false;
  }

  /**
   * Clear all conversations
   */
  clearAllConversations() {
    this.conversations = {};
    this.currentConversationId = null;
    this.saveConversations();
  }

  /**
   * Export conversation data
   */
  exportConversations() {
    return {
      conversations: this.conversations,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Import conversation data
   */
  importConversations(data) {
    try {
      if (data.conversations) {
        this.conversations = { ...this.conversations, ...data.conversations };
        this.saveConversations();
        return true;
      }
    } catch (error) {
      console.error('Error importing conversations:', error);
    }
    return false;
  }
}

/**
 * Image optimization utilities for cost-effective document analysis
 */
export class ImageOptimizer {
  static MAX_SIZE = 1024 * 1024; // 1MB max size
  static MAX_WIDTH = 1200;
  static MAX_HEIGHT = 1200;
  static QUALITY = 0.8;

  /**
   * Compress image for API upload
   */
  static async compressImage(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = this.calculateDimensions(img.width, img.height);
        
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', this.QUALITY);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal dimensions
   */
  static calculateDimensions(originalWidth, originalHeight) {
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if too large
    if (width > this.MAX_WIDTH || height > this.MAX_HEIGHT) {
      const ratio = Math.min(this.MAX_WIDTH / width, this.MAX_HEIGHT / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    return { width, height };
  }

  /**
   * Convert file to base64 with compression
   */
  static async fileToBase64(file) {
    const compressedBlob = await this.compressImage(file);
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(compressedBlob);
    });
  }

  /**
   * Validate file type and size
   */
  static validateFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB original file size limit

    if (!validTypes.includes(file.type)) {
      throw new Error('Tip de fișier neacceptat. Acceptăm doar JPEG, PNG, WebP și PDF.');
    }

    if (file.size > maxSize) {
      throw new Error('Fișierul este prea mare. Dimensiunea maximă este 10MB.');
    }

    return true;
  }
}

/**
 * Cost tracking utilities
 */
export class CostTracker {
  static COST_PER_1K_TOKENS = 0.002; // Example cost per 1k tokens
  static STORAGE_KEY = 'ai_cost_tracking';

  static updateCost(tokens) {
    const costs = this.getCosts();
    const today = new Date().toISOString().split('T')[0];
    
    if (!costs[today]) {
      costs[today] = 0;
    }
    
    costs[today] += tokens;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(costs));
  }

  static getCosts() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  static getTodaysCost() {
    const costs = this.getCosts();
    const today = new Date().toISOString().split('T')[0];
    const tokens = costs[today] || 0;
    return {
      tokens,
      estimatedCost: (tokens / 1000) * this.COST_PER_1K_TOKENS
    };
  }
}

// Create singleton instances
export const conversationManager = new ConversationManager();
export default conversationManager;
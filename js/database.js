// AgenWork Database Module
// Handles all database operations using DexieJS for offline functionality

class AgenWorkDatabase {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  // Initialize the database
  async initialize() {
    try {
      // Define the database
      this.db = new Dexie('AgenWorkDB');
      
      // Define schemas
      this.db.version(1).stores({
        conversations: '++id, title, messages, createdAt, updatedAt, agentType, archived',
        settings: '++id, key, value, updatedAt',
        messages: '++id, conversationId, role, content, timestamp, agentType, metadata'
      });

      // Define hooks for automatic timestamps
      this.db.conversations.hook('creating', function (primKey, obj, trans) {
        obj.createdAt = new Date();
        obj.updatedAt = new Date();
        obj.archived = false;
      });

      this.db.conversations.hook('updating', function (modifications, primKey, obj, trans) {
        modifications.updatedAt = new Date();
      });

      this.db.settings.hook('creating', function (primKey, obj, trans) {
        obj.updatedAt = new Date();
      });

      this.db.settings.hook('updating', function (modifications, primKey, obj, trans) {
        modifications.updatedAt = new Date();
      });

      this.db.messages.hook('creating', function (primKey, obj, trans) {
        obj.timestamp = new Date();
      });

      // Open the database
      await this.db.open();
      
      // Fix any existing records with invalid archived field
      await this.fixArchivedField();
      
      // Initialize default settings if they don't exist
      await this.initializeDefaultSettings();
      
      this.isInitialized = true;
      console.log('AgenWork database initialized successfully');
      
      return this.db;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // Fix archived field for existing conversations
  async fixArchivedField() {
    try {
      const conversations = await this.db.conversations.toArray();
      const fixedConversations = [];
      
      for (const conv of conversations) {
        if (conv.archived !== true && conv.archived !== false) {
          console.log(`Fixing conversation ${conv.id}: archived was ${conv.archived}, setting to false`);
          conv.archived = false; // Default to not archived
          fixedConversations.push(conv);
        }
      }
      
      if (fixedConversations.length > 0) {
        await this.db.conversations.bulkPut(fixedConversations);
        console.log(`Fixed archived field for ${fixedConversations.length} conversations`);
      } else {
        console.log('No conversations needed archived field fixing');
      }
    } catch (error) {
      console.error('Error fixing archived field:', error.message || error);
    }
  }

  // Initialize default settings
  async initializeDefaultSettings() {
    const defaultSettings = [
      { key: 'theme', value: 'auto' },
      { key: 'floatingEnabled', value: false },
      { key: 'floatingPosition', value: { x: 50, y: 50 } },
      { key: 'autoSave', value: true },
      { key: 'notificationsEnabled', value: true },
      { key: 'aiProvider', value: 'gemini-nano' },
      { key: 'language', value: 'en' },
      { key: 'conversationRetention', value: 30 }, // days
      { key: 'maxMessagesPerConversation', value: 100 }
    ];

    for (const setting of defaultSettings) {
      const existing = await this.db.settings.where('key').equals(setting.key).first();
      if (!existing) {
        await this.db.settings.add(setting);
      }
    }
  }

  // Conversation CRUD operations
  async createConversation(title, agentType = 'prompter') {
    try {
      const conversation = {
        title: title || `Conversation ${new Date().toLocaleString()}`,
        messages: [],
        agentType: agentType,
        archived: false
      };
      
      const id = await this.db.conversations.add(conversation);
      return await this.db.conversations.get(id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }

  async getConversation(id) {
    try {
      const conversation = await this.db.conversations.get(id);
      if (conversation) {
        // Load messages for this conversation
        conversation.messages = await this.db.messages
          .where('conversationId')
          .equals(id)
          .orderBy('timestamp')
          .toArray();
      }
      return conversation;
    } catch (error) {
      console.error('Failed to get conversation:', error);
      return null;
    }
  }

  async getAllConversations(includeArchived = false) {
    try {
      let query = this.db.conversations.orderBy('updatedAt').reverse();
      
      if (!includeArchived) {
        query = query.filter(conv => !conv.archived);
      }
      
      const conversations = await query.toArray();
      
      // Load message counts for each conversation
      for (const conv of conversations) {
        conv.messageCount = await this.db.messages
          .where('conversationId')
          .equals(conv.id)
          .count();
      }
      
      return conversations;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  async updateConversation(id, updates) {
    try {
      await this.db.conversations.update(id, updates);
      return await this.getConversation(id);
    } catch (error) {
      console.error('Failed to update conversation:', error);
      throw error;
    }
  }

  async deleteConversation(id) {
    try {
      // Delete all messages in the conversation
      await this.db.messages.where('conversationId').equals(id).delete();
      
      // Delete the conversation
      await this.db.conversations.delete(id);
      
      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  }

  async archiveConversation(id) {
    try {
      await this.db.conversations.update(id, { archived: true });
      return true;
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      return false;
    }
  }

  // Message CRUD operations
  async addMessage(conversationId, role, content, agentType = 'prompter', metadata = {}) {
    try {
      const message = {
        conversationId: conversationId,
        role: role, // 'user' or 'assistant'
        content: content,
        agentType: agentType,
        metadata: metadata
      };
      
      const messageId = await this.db.messages.add(message);
      
      // Update conversation's updatedAt timestamp
      await this.db.conversations.update(conversationId, { 
        updatedAt: new Date() 
      });
      
      return await this.db.messages.get(messageId);
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }

  async getMessages(conversationId) {
    try {
      return await this.db.messages
        .where('conversationId')
        .equals(conversationId)
        .orderBy('timestamp')
        .toArray();
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  async deleteMessage(messageId) {
    try {
      await this.db.messages.delete(messageId);
      return true;
    } catch (error) {
      console.error('Failed to delete message:', error);
      return false;
    }
  }

  // Settings CRUD operations
  async getSetting(key, defaultValue = null) {
    try {
      const setting = await this.db.settings.where('key').equals(key).first();
      return setting ? setting.value : defaultValue;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return defaultValue;
    }
  }

  async setSetting(key, value) {
    try {
      const existing = await this.db.settings.where('key').equals(key).first();
      
      if (existing) {
        await this.db.settings.update(existing.id, { value: value });
      } else {
        await this.db.settings.add({ key: key, value: value });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to set setting:', error);
      return false;
    }
  }

  async getAllSettings() {
    try {
      const settings = await this.db.settings.toArray();
      const settingsObject = {};
      
      settings.forEach(setting => {
        settingsObject[setting.key] = setting.value;
      });
      
      return settingsObject;
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return {};
    }
  }

  async deleteSetting(key) {
    try {
      await this.db.settings.where('key').equals(key).delete();
      return true;
    } catch (error) {
      console.error('Failed to delete setting:', error);
      return false;
    }
  }

  // Utility methods
  async searchConversations(query) {
    try {
      const conversations = await this.getAllConversations();
      const searchTerms = query.toLowerCase().split(' ');
      
      return conversations.filter(conv => {
        const title = conv.title.toLowerCase();
        return searchTerms.some(term => title.includes(term));
      });
    } catch (error) {
      console.error('Failed to search conversations:', error);
      return [];
    }
  }

  async getConversationsByAgent(agentType) {
    try {
      return await this.db.conversations
        .where('agentType')
        .equals(agentType)
        .and(conv => !conv.archived)
        .orderBy('updatedAt')
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Failed to get conversations by agent:', error);
      return [];
    }
  }

  async cleanupOldConversations() {
    try {
      const retentionDays = await this.getSetting('conversationRetention', 30);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const oldConversations = await this.db.conversations
        .where('updatedAt')
        .below(cutoffDate)
        .toArray();
      
      for (const conv of oldConversations) {
        await this.deleteConversation(conv.id);
      }
      
      console.log(`Cleaned up ${oldConversations.length} old conversations`);
      return oldConversations.length;
    } catch (error) {
      console.error('Failed to cleanup old conversations:', error);
      return 0;
    }
  }

  async exportData() {
    try {
      const conversations = await this.getAllConversations(true);
      const settings = await this.getAllSettings();
      
      // Load messages for each conversation
      for (const conv of conversations) {
        conv.messages = await this.getMessages(conv.id);
      }
      
      return {
        conversations: conversations,
        settings: settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async importData(data) {
    try {
      // Clear existing data
      await this.db.conversations.clear();
      await this.db.messages.clear();
      await this.db.settings.clear();
      
      // Import settings
      if (data.settings) {
        for (const [key, value] of Object.entries(data.settings)) {
          await this.setSetting(key, value);
        }
      }
      
      // Import conversations and messages
      if (data.conversations) {
        for (const conv of data.conversations) {
          const messages = conv.messages || [];
          delete conv.messages; // Remove messages from conversation object
          delete conv.id; // Let database generate new ID
          
          const newConvId = await this.db.conversations.add(conv);
          
          // Add messages
          for (const msg of messages) {
            delete msg.id; // Let database generate new ID
            msg.conversationId = newConvId;
            await this.db.messages.add(msg);
          }
        }
      }
      
      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  // Database maintenance
  async getDatabaseStats() {
    try {
      // Check if database is initialized
      if (!this.isInitialized || !this.db) {
        console.warn('Database not initialized when trying to get stats');
        return {
          conversations: 0,
          archivedConversations: 0,
          messages: 0,
          settings: 0,
          databaseSize: 0
        };
      }

      // Check if tables exist
      if (!this.db.conversations || !this.db.messages || !this.db.settings) {
        console.error('Database tables not found');
        return {
          conversations: 0,
          archivedConversations: 0,
          messages: 0,
          settings: 0,
          databaseSize: 0,
          error: true
        };
      }

      const stats = {};
      
      // Get stats for each table individually with error handling
      try {
        stats.conversations = await this.db.conversations.count();
      } catch (e) {
        console.error('Error counting conversations:', e.message || e);
        stats.conversations = 0;
      }
      
      try {
        // First try the optimized where clause, fall back to filter if it fails
        try {
          stats.archivedConversations = await this.db.conversations.where('archived').equals(true).count();
        } catch (keyError) {
          console.warn('IndexedDB key error, falling back to filter method:', keyError.message);
          // Fall back to filter method if where clause fails due to key issues
          const allConversations = await this.db.conversations.toArray();
          stats.archivedConversations = allConversations.filter(conv => conv.archived === true).length;
        }
      } catch (e) {
        console.error('Error counting archived conversations:', e.message || e);
        stats.archivedConversations = 0;
      }
      
      try {
        stats.messages = await this.db.messages.count();
      } catch (e) {
        console.error('Error counting messages:', e.message || e);
        stats.messages = 0;
      }
      
      try {
        stats.settings = await this.db.settings.count();
      } catch (e) {
        console.error('Error counting settings:', e.message || e);
        stats.settings = 0;
      }
      
      stats.databaseSize = 0; // IndexedDB doesn't provide direct size info
      
      return stats;
    } catch (error) {
      console.error('Failed to get database stats (main catch):', error.message || error.toString() || error);
      return {
        conversations: 0,
        archivedConversations: 0,
        messages: 0,
        settings: 0,
        databaseSize: 0,
        error: true
      };
    }
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.isInitialized = false;
    }
  }
}

// Create a singleton instance
const agenWorkDB = new AgenWorkDatabase();

// Export for use in other modules
window.agenWorkDB = agenWorkDB;
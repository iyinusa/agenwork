// Writer Agent Module
// Handles Chrome Built-in AI Writer API interactions (Future implementation)

class WriterAgent {
  constructor() {
    this.writer = null;
    this.preferredLanguage = 'en';
  }

  // Set preferred language
  setPreferredLanguage(language) {
    const supportedLanguages = ['en', 'ja', 'es'];
    if (!supportedLanguages.includes(language)) {
      console.warn(`Language '${language}' not supported for Writer. Supported languages: ${supportedLanguages.join(', ')}. Defaulting to 'en'.`);
      this.preferredLanguage = 'en';
      return false;
    }
    
    console.log(`Setting preferred Writer language to: ${language}`);
    this.preferredLanguage = language;
    
    // If we have active agent, we may need to recreate it with the new language
    if (this.writer) {
      console.log('Note: Existing writer will use the new language on next creation');
    }
    
    return true;
  }

  // Create writer instance with comprehensive availability checking
  async createWriter(options = {}) {
    try {
      console.log('Performing comprehensive Writer API availability check...');
      
      // Comprehensive availability check - validates Supported, Availability, and Ready states
      const availabilityResult = await ChromeIntegration.validateAPIReadiness('Writer');
      console.log('Writer comprehensive check result:', availabilityResult);

      // If we reach here, all three checks (Supported, Availability, Ready) have passed
      if (!availabilityResult.passed) {
        throw new Error(`Writer API comprehensive check failed: ${availabilityResult.error}`);
      }

      if (availabilityResult.availability === 'after-download') {
        console.log('Writer model needs to be downloaded first - this may take time');
      }

      // Default options for writer according to Chrome documentation
      const defaultOptions = {
        tone: 'neutral', // 'casual', 'formal', 'neutral'
        format: 'plain-text', // 'plain-text', 'markdown'
        length: 'medium', // 'short', 'medium', 'long'
        outputLanguage: this.preferredLanguage,
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Writer model download: ${(e.loaded * 100).toFixed(1)}%`);
            // Send progress update to UI
            AIUtils.notifyProgress('writer', e.loaded * 100);
          });
        }
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Check for user activation requirement (required for model downloads)
      if (!navigator.userActivation || !navigator.userActivation.isActive) {
        console.info('Note: User activation may be required for Writer API model downloads. If you see permission errors, try clicking a button or interacting with the page first.');
      }

      console.log('Creating writer with options:', finalOptions);
      
      // Create writer using Chrome Built-in AI pattern
      this.writer = await window.Writer.create(finalOptions);
      
      console.log('Writer created successfully');
      return this.writer;

    } catch (error) {
      console.error('Error creating writer:', error);
      throw new Error(`Failed to create writer: ${error.message}`);
    }
  }

  // Write content based on prompt (Future implementation)
  async writeContent(prompt, context = '', options = {}) {
    try {
      // For now, return a placeholder message since Writer API is not yet available
      return `Writing assistance feature will be implemented when Chrome's Writer API becomes available. 

**Your request**: "${prompt}"
${context ? `\n**Context**: ${context}` : ''}

**Note**: This feature is planned for future Chrome versions. Currently, you can use the research/prompter functionality for writing assistance.`;

      // Future implementation when Writer API is available:
      /*
      const writerOptions = {
        tone: options.tone || 'neutral',
        format: options.format || 'markdown',
        length: options.length || 'medium',
        outputLanguage: await AIUtils.getOutputLanguage(this.preferredLanguage),
        sharedContext: context || 'Help the user with writing content'
      };

      const writer = await this.createWriter(writerOptions);

      if (!writer) {
        throw new Error('Failed to create writer');
      }

      if (!prompt || prompt.trim().length === 0) {
        throw new Error('No prompt provided for writing');
      }

      console.log(`Writing content based on prompt: "${prompt}"`);

      const writingOptions = context ? { context } : {};
      const content = await writer.write(prompt, writingOptions);
      
      // Clean up
      writer.destroy();
      
      console.log('Content written successfully');
      return content;
      */

    } catch (error) {
      console.error('Error during content writing:', error);
      throw new Error(`Writing failed: ${error.message}`);
    }
  }

  // Help with different types of writing tasks
  async helpWithWriting(task, details, context = '') {
    const writingTypes = {
      'email': 'professional email',
      'letter': 'formal letter',
      'essay': 'structured essay',
      'article': 'informative article',
      'blog': 'blog post',
      'summary': 'content summary',
      'report': 'detailed report',
      'proposal': 'business proposal',
      'creative': 'creative writing'
    };

    const taskType = writingTypes[task.toLowerCase()] || 'content';
    const prompt = `Help me write a ${taskType}. ${details}`;
    
    return await this.writeContent(prompt, context, {
      tone: this.getToneForTask(task),
      format: 'markdown',
      length: this.getLengthForTask(task)
    });
  }

  // Get appropriate tone for different writing tasks
  getToneForTask(task) {
    const toneMap = {
      'email': 'formal',
      'letter': 'formal',
      'essay': 'formal',
      'article': 'neutral',
      'blog': 'casual',
      'summary': 'neutral',
      'report': 'formal',
      'proposal': 'formal',
      'creative': 'casual'
    };
    
    return toneMap[task.toLowerCase()] || 'neutral';
  }

  // Get appropriate length for different writing tasks
  getLengthForTask(task) {
    const lengthMap = {
      'email': 'short',
      'letter': 'medium',
      'essay': 'long',
      'article': 'long',
      'blog': 'medium',
      'summary': 'short',
      'report': 'long',
      'proposal': 'long',
      'creative': 'medium'
    };
    
    return lengthMap[task.toLowerCase()] || 'medium';
  }

  // Destroy writer instance
  async destroy() {
    if (this.writer) {
      try {
        this.writer.destroy();
        this.writer = null;
        console.log('Writer destroyed');
      } catch (error) {
        console.error('Error destroying writer:', error);
      }
    }
  }

  // Get writer capabilities with comprehensive checking
  async getCapabilities() {
    try {
      // Use comprehensive availability checking
      const comprehensiveResult = await ChromeIntegration.checkComprehensiveAvailability('Writer');
      
      const capabilities = {
        supported: comprehensiveResult.supported,
        availability: comprehensiveResult.availability,
        available: comprehensiveResult.availability !== 'no',
        ready: comprehensiveResult.ready,
        passed: comprehensiveResult.passed,
        instanceReady: !!this.writer,
        plannedFeature: !comprehensiveResult.supported, // True if not yet available
        error: comprehensiveResult.error,
        details: comprehensiveResult.details,
        lastChecked: comprehensiveResult.timestamp
      };

      console.log('Writer capabilities (comprehensive check):', capabilities);
      return capabilities;

    } catch (error) {
      console.error('Error checking writer capabilities:', error);
      return {
        supported: false,
        availability: 'no',
        available: false,
        ready: false,
        passed: false,
        instanceReady: !!this.writer,
        plannedFeature: true,
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  // Quick test method for writer functionality
  async testWriter() {
    try {
      console.log('🧪 Testing Writer Agent...');
      
      const capabilities = await this.getCapabilities();
      console.log('✓ Capabilities Check:', capabilities);
      
      if (!capabilities.supported) {
        console.log('ℹ️ Writer API not yet available in Chrome - this is expected');
        return {
          success: true,
          capabilities: capabilities,
          message: 'Writer API is planned for future Chrome versions',
          placeholderTest: await this.writeContent('Write a brief introduction about AI')
        };
      }

      if (!capabilities.available) {
        throw new Error('Writer API not available on this device');
      }

      // Test simple writing task
      const testPrompt = 'Write a brief introduction about artificial intelligence';
      const content = await this.writeContent(testPrompt);
      
      console.log('✓ Writing Test Results:');
      console.log(`  Prompt: "${testPrompt}"`);
      console.log(`  Generated: "${content}"`);
      
      return {
        success: true,
        capabilities: capabilities,
        writtenContent: content
      };

    } catch (error) {
      console.error('❌ Writer test failed:', error);
      return {
        success: false,
        error: error.message,
        capabilities: await this.getCapabilities()
      };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WriterAgent;
} else if (typeof window !== 'undefined') {
  window.WriterAgent = WriterAgent;
}
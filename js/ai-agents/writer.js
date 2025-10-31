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

  // Write content based on prompt
  async writeContent(prompt, context = '', options = {}) {
    try {
      console.log('📝 Starting Writer Agent - writeContent');
      console.log('Prompt:', prompt);
      console.log('Context:', context);
      console.log('Options:', options);

      // Validate input
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('No prompt provided for writing');
      }

      // Check Writer API availability
      const capabilities = await this.getCapabilities();
      
      if (!capabilities.supported) {
        console.log('ℹ️ Writer API not yet available, using fallback with LanguageModel');
        return await this.writeContentFallback(prompt, context, options);
      }

      if (!capabilities.available) {
        throw new Error('Writer API is not available on this device. Please check system requirements.');
      }

      // Prepare writer options
      const writerOptions = {
        tone: options.tone || 'neutral', // 'casual', 'formal', 'neutral'
        format: options.format || 'markdown', // 'markdown', 'plain-text'
        length: options.length || 'medium', // 'short', 'medium', 'long'
        outputLanguage: options.outputLanguage || this.preferredLanguage,
        sharedContext: context || 'Help the user with writing content'
      };

      // Create writer instance
      const writer = await this.createWriter(writerOptions);

      if (!writer) {
        throw new Error('Failed to create writer instance');
      }

      console.log(`✍️ Writing content with Writer API...`);

      // Write content using Writer API
      const writingOptions = context ? { context } : {};
      const content = await writer.write(prompt, writingOptions);
      
      // Clean up
      writer.destroy();
      
      console.log('✅ Content written successfully');
      
      // Format result as markdown
      return `**Generated Content**\n\n${content}\n\n*Written with Chrome Built-in Writer API*`;

    } catch (error) {
      console.error('❌ Error during content writing:', error);
      
      // Try fallback if Writer API fails
      if (error.message.includes('Writer API') || error.message.includes('not available')) {
        console.log('🔄 Falling back to LanguageModel for writing assistance...');
        return await this.writeContentFallback(prompt, context, options);
      }
      
      throw new Error(`Writing failed: ${error.message}`);
    }
  }

  // Fallback writing method using LanguageModel API
  async writeContentFallback(prompt, context = '', options = {}) {
    try {
      console.log('📝 Using LanguageModel fallback for writing assistance');
      
      // Check if LanguageModel is available
      if (!window.LanguageModel) {
        return `**Writing Assistance Not Available**\n\nThe Writer API and LanguageModel API are not available in your browser.\n\n**Your request**: "${prompt}"\n${context ? `\n**Context**: ${context}` : ''}\n\n**Note**: This feature requires Chrome 138+ with Built-in AI APIs enabled.`;
      }

      // Create a writing prompt for LanguageModel
      const tone = options.tone || 'neutral';
      const length = options.length || 'medium';
      const format = options.format || 'markdown';
      
      let lengthGuidance = '';
      if (length === 'short') lengthGuidance = 'Keep it brief and concise (1-2 paragraphs).';
      else if (length === 'medium') lengthGuidance = 'Make it a reasonable length (3-5 paragraphs).';
      else if (length === 'long') lengthGuidance = 'Make it comprehensive and detailed (6+ paragraphs).';
      
      let toneGuidance = '';
      if (tone === 'formal') toneGuidance = 'Use a formal, professional tone.';
      else if (tone === 'casual') toneGuidance = 'Use a casual, friendly tone.';
      else toneGuidance = 'Use a neutral, balanced tone.';
      
      const formatGuidance = format === 'markdown' ? 
        'Format the output in markdown with proper headings, lists, and emphasis where appropriate.' :
        'Format the output as plain text.';

      // Regular content writing only - no code generation
      const systemPrompt = `You are a professional writing assistant. ${toneGuidance} ${lengthGuidance} ${formatGuidance}

${context ? `Context: ${context}\n\n` : ''}Write content for the following request:

${prompt}

IMPORTANT: Focus on written content only. Do not generate code, scripts, or programming examples.`;

      // Use LanguageModel to generate content
      const languageModel = await window.LanguageModel.create({
        temperature: 0.8,
        topK: 3
      });

      const content = await languageModel.prompt(systemPrompt);
      languageModel.destroy();
      
      console.log('✅ Content generated using LanguageModel fallback');
      
      // Format result as markdown
      return `**Generated Content**\n\n${content}\n\n*Written with AI assistance*`;

    } catch (fallbackError) {
      console.error('❌ Fallback writing failed:', fallbackError);
      
      // Final fallback with helpful message
      return `**Writing Assistance Currently Unavailable**\n\nI encountered an error while trying to help with your writing request.\n\n**Your request**: "${prompt}"\n${context ? `\n**Context**: ${context}` : ''}\n\n**Error**: ${fallbackError.message}\n\n**Suggestions**:\n1. Ensure you're using Chrome 138+ with Built-in AI APIs enabled\n2. Check that Gemini Nano model is downloaded at \`chrome://on-device-internals\`\n3. Try the Prompter/Research feature for general AI assistance\n\n**Note**: The Writer API is still in development. You can use the research/prompter functionality for writing assistance in the meantime.`;
    }
  }

  // Write with streaming output (for real-time updates)
  async writeContentStreaming(prompt, context = '', options = {}, onChunk = null) {
    try {
      console.log('📝 Starting streaming write');

      // Validate input
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('No prompt provided for writing');
      }

      // Check Writer API availability
      const capabilities = await this.getCapabilities();
      
      if (!capabilities.supported || !capabilities.available) {
        console.log('ℹ️ Streaming not available, falling back to regular write');
        return await this.writeContent(prompt, context, options);
      }

      // Prepare writer options
      const writerOptions = {
        tone: options.tone || 'neutral',
        format: options.format || 'markdown',
        length: options.length || 'medium',
        outputLanguage: options.outputLanguage || this.preferredLanguage,
        sharedContext: context || 'Help the user with writing content'
      };

      // Create writer instance
      const writer = await this.createWriter(writerOptions);

      if (!writer) {
        throw new Error('Failed to create writer instance');
      }

      console.log(`✍️ Streaming content with Writer API...`);

      // Write content using Writer API with streaming
      const writingOptions = context ? { context } : {};
      const stream = writer.writeStreaming(prompt, writingOptions);
      
      let fullContent = '';
      
      for await (const chunk of stream) {
        fullContent += chunk;
        if (onChunk && typeof onChunk === 'function') {
          onChunk(chunk);
        }
      }
      
      // Clean up
      writer.destroy();
      
      console.log('✅ Streaming write completed');
      
      // Format result as markdown
      return `**Generated Content**\n\n${fullContent}\n\n*Written with Chrome Built-in Writer API (Streaming)*`;

    } catch (error) {
      console.error('❌ Error during streaming write:', error);
      
      // Fallback to regular write
      console.log('🔄 Falling back to non-streaming write...');
      return await this.writeContent(prompt, context, options);
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
      'creative': 'creative writing',
      'cover-letter': 'cover letter',
      'response': 'response message'
    };

    const taskType = writingTypes[task.toLowerCase()] || 'content';
    const prompt = `Help me write a ${taskType}. ${details}`;
    
    return await this.writeContent(prompt, context, {
      tone: this.getToneForTask(task),
      format: 'markdown',
      length: this.getLengthForTask(task)
    });
  }

  // Specialized method: Draft email response
  async draftEmailResponse(emailContent, intent = 'respond professionally', tone = 'formal') {
    const context = `Original email content: ${emailContent}`;
    const prompt = `Draft a ${tone} email response. Intent: ${intent}`;
    
    return await this.writeContent(prompt, context, {
      tone: tone,
      format: 'plain-text',
      length: 'medium'
    });
  }

  // Specialized method: Generate cover letter
  async generateCoverLetter(jobDescription, userBackground, additionalInfo = '') {
    const context = `Job Description:\n${jobDescription}\n\nCandidate Background:\n${userBackground}${additionalInfo ? `\n\nAdditional Information:\n${additionalInfo}` : ''}`;
    const prompt = 'Write a compelling cover letter that highlights relevant skills and experience for this position';
    
    return await this.writeContent(prompt, context, {
      tone: 'formal',
      format: 'plain-text',
      length: 'long'
    });
  }

  // Specialized method: Creative writing from page content
  async createFromPageContent(pageContent, creativeDirection, style = 'casual') {
    const context = `Page content as inspiration:\n${pageContent.substring(0, 2000)}`; // Limit context
    const prompt = `Create creative content: ${creativeDirection}`;
    
    return await this.writeContent(prompt, context, {
      tone: style,
      format: 'markdown',
      length: 'medium'
    });
  }

  // Specialized method: Improve/rewrite existing content
  async improveContent(originalContent, improvementGoals = 'make it more engaging and clear') {
    const context = `Original content to improve:\n${originalContent}`;
    const prompt = `Improve this content by: ${improvementGoals}`;
    
    return await this.writeContent(prompt, context, {
      tone: 'neutral',
      format: 'markdown',
      length: 'medium'
    });
  }

  // Specialized method: Generate social media post
  async generateSocialPost(topic, platform = 'general', hashtags = true) {
    const platformGuidance = {
      'twitter': 'Keep it under 280 characters, punchy and engaging',
      'linkedin': 'Professional tone, suitable for business networking',
      'facebook': 'Conversational and friendly, encourage engagement',
      'instagram': 'Visual-friendly description with emojis',
      'general': 'Engaging social media post'
    };
    
    const guidance = platformGuidance[platform.toLowerCase()] || platformGuidance['general'];
    const prompt = `Create a social media post about: ${topic}. ${guidance}${hashtags ? ' Include relevant hashtags.' : ''}`;
    
    return await this.writeContent(prompt, '', {
      tone: platform === 'linkedin' ? 'formal' : 'casual',
      format: 'plain-text',
      length: 'short'
    });
  }

  // Specialized method: Write blog post
  async writeBlogPost(topic, outline = '', targetAudience = 'general readers') {
    const context = outline ? `Outline:\n${outline}\n\nTarget audience: ${targetAudience}` : `Target audience: ${targetAudience}`;
    const prompt = `Write an engaging blog post about: ${topic}`;
    
    return await this.writeContent(prompt, context, {
      tone: 'casual',
      format: 'markdown',
      length: 'long'
    });
  }

  // Specialized method: Write product description
  async writeProductDescription(productInfo, features, benefits) {
    const context = `Product Information:\n${productInfo}\n\nKey Features:\n${features}\n\nBenefits:\n${benefits}`;
    const prompt = 'Write a compelling product description that highlights features and benefits';
    
    return await this.writeContent(prompt, context, {
      tone: 'neutral',
      format: 'markdown',
      length: 'medium'
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
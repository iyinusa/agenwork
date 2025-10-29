// AI Agents Module for AgenWork
// Handles all Chrome Built-in AI API interactions

class AIAgents {
  constructor() {
    this.summarizer = null;
    this.translator = null;
    this.writer = null;
    this.prompter = null;
    this.initialized = false;
    this.preferredLanguage = 'en'; // Default to English, supported: 'en', 'es', 'ja'
  }

  // Initialize the AI Agents system
  async initialize() {
    try {
      console.log('Initializing AI Agents...');
      
      const support = AIAgents.isSupported();
      console.log('AI APIs support check:', support);
      
      if (support.summarizer) {
        console.log('✓ Summarizer API available');
      }
      if (support.prompter) {
        console.log('✓ LanguageModel API available');
      }
      if (support.translator) {
        console.log('✓ Translator API available');
      }
      if (support.writer) {
        console.log('✓ Writer API available');
      }
      
      if (!support.summarizer && !support.prompter && !support.translator && !support.writer) {
        console.warn('⚠️ No Chrome Built-in AI APIs detected');
        
        const chromeVersion = AIAgents.getChromeVersion();
        if (!chromeVersion || chromeVersion < 138) {
          console.warn(`Chrome version ${chromeVersion || 'Unknown'} detected. Chrome 138+ required for Built-in AI APIs.`);
        }
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize AI Agents:', error);
      this.initialized = false;
      return false;
    }
  }

  // Set preferred language for AI operations
  setPreferredLanguage(language) {
    const supportedLanguages = ['en', 'es', 'ja'];
    if (!supportedLanguages.includes(language)) {
      console.warn(`Language '${language}' not supported. Supported languages: ${supportedLanguages.join(', ')}. Defaulting to 'en'.`);
      this.preferredLanguage = 'en';
      return false;
    }
    
    console.log(`Setting preferred AI language to: ${language}`);
    this.preferredLanguage = language;
    
    // If we have active agents, we may need to recreate them with the new language
    if (this.summarizer) {
      console.log('Note: Existing summarizer will use the new language on next creation');
    }
    
    return true;
  }

  // Get current preferred language
  getPreferredLanguage() {
    return this.preferredLanguage;
  }

  // Get output language for AI operations
  async getOutputLanguage() {
    // First try to get from Chrome storage (popup settings)
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['aiLanguage']);
        if (result.aiLanguage) {
          return result.aiLanguage;
        }
      }
    } catch (error) {
      console.warn('Could not get language from storage:', error);
    }
    
    // Fallback to preferred language
    return this.preferredLanguage;
  }

  // Get supported languages for AI operations
  static getSupportedLanguages() {
    return {
      summarizer: ['en', 'es', 'ja'],
      languageModel: ['en', 'ja', 'es'], // Based on Chrome documentation
      translator: ['auto-detect'], // Dynamic language detection
      writer: ['en', 'ja', 'es']
    };
  }

  // Check if browser supports AI APIs (Updated for Chrome 138+ Built-in AI APIs)
  static isSupported() {
    const hasWindow = typeof window !== 'undefined';
    
    // Check for AI APIs directly as global objects according to Chrome Built-in AI documentation
    const hasSummarizer = hasWindow && 'Summarizer' in window;
    const hasLanguageModel = hasWindow && 'LanguageModel' in window;
    const hasTranslator = hasWindow && 'Translator' in window;
    const hasWriter = hasWindow && 'Writer' in window;
    
    console.log('AI Support Check (Chrome Built-in AI):', {
      hasWindow,
      hasSummarizer,
      hasLanguageModel,
      hasTranslator,
      hasWriter,
      summarizerType: hasWindow && window.Summarizer ? typeof window.Summarizer : 'not found',
      languageModelType: hasWindow && window.LanguageModel ? typeof window.LanguageModel : 'not found',
      userAgent: hasWindow ? navigator.userAgent : 'N/A',
      chromeVersion: hasWindow ? this.getChromeVersion() : 'N/A'
    });
    
    return {
      summarizer: hasSummarizer,
      translator: hasTranslator,
      writer: hasWriter,
      prompter: hasLanguageModel, // Prompt API uses LanguageModel
      hasWindow: hasWindow
    };
  }

  // Get Chrome version for debugging (Enhanced for better detection)
  static getChromeVersion() {
    if (typeof navigator === 'undefined') return null;
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    if (!match) return null;
    
    const version = parseInt(match[1]);
    console.log(`Detected Chrome version: ${version}`);
    return version;
  }

  // Check if the current Chrome version supports Built-in AI APIs
  static isChromeVersionSupported() {
    const version = this.getChromeVersion();
    return version && version >= 138;
  }

  // Generate helpful error messages based on Chrome version and API availability
  static generateHelpfulErrorMessage(apiName, error) {
    const chromeVersion = this.getChromeVersion();
    const isVersionSupported = this.isChromeVersionSupported();
    
    let message = `## ${apiName} API Error\n\n`;
    
    if (!chromeVersion) {
      message += "❌ **Not using Chrome**: This extension requires Google Chrome with built-in AI APIs.\n\n";
      message += "**Solution**: Please use Google Chrome browser.\n\n";
    } else if (!isVersionSupported) {
      message += `❌ **Chrome version too old**: Current version ${chromeVersion}, required 138+\n\n`;
      message += "**Solution**: Update Chrome to the latest version.\n\n";
    } else {
      message += `✅ **Chrome version**: ${chromeVersion} (supported)\n\n`;
      message += "❌ **API not available**: The AI APIs may not be enabled.\n\n";
      message += "**Solutions**:\n";
      message += "1. Enable Chrome AI flags at `chrome://flags/`\n";
      message += "2. Check `chrome://on-device-internals` for model status\n";
      message += "3. Ensure sufficient storage (22GB+ free space)\n";
      message += "4. Ensure sufficient RAM (16GB+)\n\n";
    }
    
    message += `**Technical Error**: ${error.message}\n\n`;
    message += "**Need Help?** Check the extension's README for detailed setup instructions.";
    
    return message;
  }

  // Summarizer Agent Implementation (Chrome Built-in AI - Updated for Chrome 138+)
  async createSummarizer(options = {}) {
    try {
      console.log('Checking Summarizer API availability...');
      
      const support = AIAgents.isSupported();
      console.log('Browser support check:', support);
      
      if (!support.hasWindow) {
        throw new Error('Window object not available - running outside browser context');
      }
      
      if (!support.summarizer) {
        throw new Error('Summarizer API is not available in this browser. Please ensure you have Chrome 138+ and the Built-in AI APIs are enabled.');
      }

      // Check availability using the correct Chrome Built-in AI pattern
      console.log('Checking Summarizer availability...');
      const availability = await window.Summarizer.availability();
      console.log('Summarizer availability:', availability);

      if (availability === 'no') {
        throw new Error('Summarizer API is not available on this device. Please check system requirements (Chrome 138+, 16GB RAM, 22GB storage). You may also need to enable Chrome flags.');
      }

      if (availability === 'after-download') {
        console.log('Summarizer model needs to be downloaded first');
      }

      // Default options for summarizer according to Chrome documentation
      const defaultOptions = {
        type: 'key-points', // 'key-points', 'tldr', 'teaser', 'headline'
        format: 'markdown', // 'markdown', 'plain-text'
        length: 'medium', // 'short', 'medium', 'long'
        outputLanguage: this.preferredLanguage, // Required: 'en', 'es', 'ja' - prevents safety warning
        sharedContext: 'This is content from a web page that the user wants summarized.',
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Summarizer model download: ${(e.loaded * 100).toFixed(1)}%`);
            // Send progress update to UI
            this.notifyProgress('summarizer', e.loaded * 100);
          });
        }
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Check for user activation requirement (required for model downloads)
      if (!navigator.userActivation || !navigator.userActivation.isActive) {
        console.warn('User activation may be required for Summarizer API');
        // Don't throw error, just warn - the API may work if model is already downloaded
      }

      console.log('Creating summarizer with options:', finalOptions);
      
      // Create summarizer using Chrome Built-in AI pattern
      this.summarizer = await window.Summarizer.create(finalOptions);
      
      console.log('Summarizer created successfully');
      return this.summarizer;

    } catch (error) {
      console.error('Error creating summarizer:', error);
      throw new Error(`Failed to create summarizer: ${error.message}`);
    }
  }

  // Summarize text content
  async summarizeText(text, context = '', intentResult = null) {
    try {
      // Use intelligent summarization options if available
      const outputLanguage = await this.getOutputLanguage();
      const summaryOptions = {
        type: intentResult?.summarization_type || 'key-points',
        length: intentResult?.summarization_length || 'medium',
        format: 'markdown',
        outputLanguage: outputLanguage,
        sharedContext: context || 'Please summarize this text'
      };

      // Create or recreate summarizer with intelligent options
      console.log('Creating intelligent summarizer with options:', summaryOptions);
      const summarizer = await this.createSummarizer(summaryOptions);

      if (!summarizer) {
        throw new Error('Failed to create intelligent summarizer');
      }

      if (!text || text.trim().length === 0) {
        throw new Error('No text provided for summarization');
      }

      // Clean text (remove HTML tags, excessive whitespace)
      const cleanText = this.cleanTextForSummarization(text);
      
      if (cleanText.length < 50) {
        return 'The provided text is too short to summarize effectively.';
      }

      console.log(`Intelligently summarizing text (${cleanText.length} characters) with type: ${summaryOptions.type}, length: ${summaryOptions.length}...`);

      const options = context ? { context } : {};
      const summary = await summarizer.summarize(cleanText, options);
      
      // Clean up
      summarizer.destroy();
      
      console.log('Intelligent summary generated successfully');
      return summary;

    } catch (error) {
      console.error('Error during intelligent summarization:', error);
      throw new Error(`Summarization failed: ${error.message}`);
    }
  }

  // Summarize current page content
  async summarizeCurrentPage() {
    try {
      // Get current tab content
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Inject content script to extract page content
      let results;
      try {
        results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: extractPageContentFunction
        });
      } catch (scriptError) {
        console.error('Script injection error:', scriptError);
        throw new Error(`Cannot access page content. This might be due to page restrictions or permissions. Error: ${scriptError.message}`);
      }

      if (!results || !results[0]) {
        throw new Error('No results returned from content extraction');
      }

      if (!results[0].result) {
        throw new Error('Content extraction returned empty result');
      }

      const pageData = results[0].result;
      
      if (!pageData) {
        throw new Error('Failed to extract page data');
      }

      if (pageData.error) {
        throw new Error(`Content extraction error: ${pageData.error}`);
      }
      
      if (!pageData.content || pageData.content.trim().length === 0) {
        throw new Error('No meaningful content found on this page. The page might be loading or have restricted content.');
      }

      if (pageData.content.trim().length < 50) {
        throw new Error('Page content is too short to summarize effectively.');
      }

      // Create context from page metadata
      const context = `This is content from the webpage titled "${pageData.title}" (${pageData.url}). The user wants a summary of this page.`;

      // Summarize the content
      const summary = await this.summarizeText(pageData.content, context, null);

      return {
        title: pageData.title,
        url: pageData.url,
        summary: summary,
        wordCount: pageData.content.split(/\s+/).length
      };

    } catch (error) {
      console.error('Error summarizing current page:', error);
      
      // Try fallback method using content script messaging
      try {
        console.log('Trying fallback content extraction method...');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab) {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTENT' });
          
          if (response && response.success && response.content && response.content.content) {
            const context = `This is content from the webpage titled "${response.content.title}" (${response.content.url}). The user wants a summary of this page.`;
            const summary = await this.summarizeText(response.content.content, context, null);
            
            return {
              title: response.content.title,
              url: response.content.url,
              summary: summary,
              wordCount: response.content.wordCount || response.content.content.split(/\s+/).length
            };
          }
        }
      } catch (fallbackError) {
        console.error('Fallback content extraction also failed:', fallbackError);
      }
      
      throw new Error(`Failed to summarize page: ${error.message}`);
    }
  }



  // Clean text for better summarization
  cleanTextForSummarization(text) {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
      .trim();
  }

  // Prompter Agent Implementation (Chrome Built-in AI Prompt API - Updated for Chrome 138+)
  async createPrompter(options = {}) {
    try {
      console.log('Checking Language Model API availability...');
      
      const support = AIAgents.isSupported();
      console.log('Browser support check:', support);
      
      if (!support.hasWindow) {
        throw new Error('Window object not available - running outside browser context');
      }
      
      if (!support.prompter) {
        throw new Error('Language Model API is not available in this browser. Please ensure you have Chrome 138+ and the Built-in AI APIs are enabled.');
      }

      // Check availability using the correct Chrome Built-in AI pattern
      console.log('Checking Language Model availability...');
      const availability = await window.LanguageModel.availability();
      console.log('Language Model availability:', availability);

      if (availability === 'no') {
        throw new Error('Language Model API is not available on this device. Please check system requirements (Chrome 138+, 16GB RAM, 22GB storage, 4GB+ VRAM or 4+ CPU cores). You may also need to enable Chrome flags.');
      }

      if (availability === 'after-download') {
        console.log('Gemini Nano model needs to be downloaded first');
      }

      // Get model parameters according to Chrome documentation
      let modelParams;
      try {
        modelParams = await window.LanguageModel.params();
        console.log('Language Model params:', modelParams);
      } catch (error) {
        console.warn('Could not get Language Model params, using defaults:', error);
        modelParams = {defaultTopK: 3, maxTopK: 128, defaultTemperature: 1, maxTemperature: 2};
      }

      // Default options for language model according to Chrome documentation
      const defaultOptions = {
        temperature: modelParams?.defaultTemperature || 0.8, // Use model defaults
        topK: modelParams?.defaultTopK || 3,
        monitor: (m) => {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Gemini Nano model download: ${(e.loaded * 100).toFixed(1)}%`);
            // Send progress update to UI
            this.notifyProgress('prompter', e.loaded * 100);
          });
        }
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Check for user activation requirement (required for model downloads)
      if (!navigator.userActivation || !navigator.userActivation.isActive) {
        console.warn('User activation may be required for Language Model API');
        // Don't throw error, just warn - the API may work if model is already downloaded
      }

      console.log('Creating Language Model session with options:', finalOptions);
      
      // Create language model session using Chrome Built-in AI pattern
      this.prompter = await window.LanguageModel.create(finalOptions);
      
      console.log('Language Model session created successfully');
      return this.prompter;

    } catch (error) {
      console.error('Error creating prompter:', error);
      throw new Error(`Failed to create prompter: ${error.message}`);
    }
  }

  // Intelligent intent detection using Gemini Nano
  async detectIntentWithAI(userMessage, pageContext = null) {
    try {
      if (!this.prompter) {
        await this.createPrompter();
      }

      if (!userMessage || userMessage.trim().length === 0) {
        throw new Error('No message provided for intent detection');
      }

      console.log('Detecting intent for:', userMessage);

      // Create a comprehensive system prompt for intent classification
      const systemPrompt = `You are an intelligent intent classifier for a browser extension that helps users with various tasks. Your job is to analyze user messages and classify their intent into one of these categories:

INTENT CATEGORIES:
1. "summarize" - User wants to summarize content (page, article, text, document)
2. "translate" - User wants to translate text or page content to another language
3. "write" - User wants help writing, composing, drafting, or creating content
4. "research" - User wants to research, learn about, or get information on a topic

CLASSIFICATION RULES:
- If the user mentions summarize, summary, tldr, overview, brief, main points, or wants to condense content → "summarize"
- If the user mentions translate, translation, convert language, or specific language names → "translate"  
- If the user mentions write, compose, draft, create, generate, or help with writing → "write"
- If the user mentions research, find, search, learn, explain, tell me about, what is → "research"
- A message can have multiple intents - identify the primary one and any secondary intents
- Consider context clues and implied meanings

SUMMARIZATION TYPE DETECTION:
When the intent is "summarize", also determine the specific summarization type:
- "key-points" - User wants bullet points, main points, key takeaways, important points
- "tldr" - User wants a quick summary, brief overview, short summary, tldr, condensed version
- "teaser" - User wants an intriguing preview, teaser, hook, something to draw interest
- "headline" - User wants a title, headline, single sentence summary, main point in headline format

RESPONSE FORMAT:
Respond with a JSON object containing:
{
  "primary": "intent_name",
  "confidence": 0.0-1.0,
  "secondary": ["intent_name1", "intent_name2"] or null,
  "reasoning": "brief explanation of why this intent was chosen",
  "crafted_prompt": "an enhanced version of the user message optimized for the target agent",
  "summarization_type": "key-points|tldr|teaser|headline" (only when primary intent is "summarize"),
  "summarization_length": "short|medium|long" (only when primary intent is "summarize")
}`;

      // Add page context if available
      let contextInfo = '';
      if (pageContext) {
        contextInfo = `\n\nCURRENT PAGE CONTEXT:
Title: ${pageContext.title || 'Unknown'}
URL: ${pageContext.url || 'Unknown'}
Content Preview: ${pageContext.contentPreview || 'Not available'}`;
      }

      const fullPrompt = `${systemPrompt}${contextInfo}

USER MESSAGE: "${userMessage}"

Analyze this message and respond with the JSON classification:`;

      // Get AI classification - Chrome Built-in AI doesn't support responseConstraint
      // So we'll rely on the prompt instructions to get structured JSON output
      const response = await this.prompter.prompt(fullPrompt);

      let result;
      try {
        // Try to extract JSON from the response (it might have extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = JSON.parse(response);
        }
        console.log('AI Intent Detection Result:', result);
      } catch (parseError) {
        console.warn('Failed to parse AI response as JSON:', parseError);
        console.log('Raw AI response:', response);
        throw new Error(`AI response could not be parsed as JSON: ${parseError.message}`);
      }

      return {
        primary: result.primary,
        confidence: result.confidence,
        secondary: result.secondary || [],
        reasoning: result.reasoning,
        craftedPrompt: result.crafted_prompt,
        originalMessage: userMessage,
        aiPowered: true,
        // Summarization-specific properties
        summarizationType: result.summarization_type || null,
        summarizationLength: result.summarization_length || null
      };

    } catch (error) {
      console.error('Error in AI intent detection:', error);
      
      // Fallback to simple pattern-based detection
      console.log('Falling back to pattern-based intent detection');
      return this.detectIntentFallback(userMessage);
    }
  }

  // Fallback intent detection using patterns (existing logic)
  detectIntentFallback(message) {
    const intents = {
      summarize: {
        keywords: ['summarize', 'summary', 'tldr', 'brief', 'overview', 'sum up', 'digest', 'condense'],
        patterns: [
          /summarize (this|the|current)? ?(page|article|content|text)/i,
          /give me a (summary|overview|brief)/i,
          /what (is|are) the (main|key) points/i,
          /tldr/i,
          /can you summarize/i
        ]
      },
      translate: {
        keywords: ['translate', 'translation', 'convert', 'language'],
        patterns: [
          /translate (this|the|current)? ?(page|text|content)? ?(to|into|in) ?\w+/i,
          /(spanish|french|german|chinese|japanese|italian|portuguese)\s+(translation|version)/i,
          /what does this mean in \w+/i,
          /convert to \w+ language/i
        ]
      },
      write: {
        keywords: ['write', 'compose', 'draft', 'create', 'help me write', 'generate'],
        patterns: [
          /help me write (a|an)? ?\w+/i,
          /compose (a|an)? ?\w+/i,
          /draft (a|an)? ?\w+/i,
          /create (a|an)? ?\w+/i,
          /generate (a|an)? ?\w+/i
        ]
      },
      research: {
        keywords: ['research', 'find', 'search', 'learn', 'tell me about', 'explain', 'what is'],
        patterns: [
          /tell me about \w+/i,
          /what is \w+/i,
          /explain \w+/i,
          /research \w+/i,
          /find (information|info) about/i,
          /learn (more )?about/i
        ]
      }
    };
    
    const lowerMessage = message.toLowerCase();
    const scores = {};
    
    // Score each intent
    for (const [intent, config] of Object.entries(intents)) {
      let score = 0;
      
      // Check keywords
      for (const keyword of config.keywords) {
        if (lowerMessage.includes(keyword)) {
          score += 1;
        }
      }
      
      // Check patterns
      for (const pattern of config.patterns) {
        if (pattern.test(message)) {
          score += 2;
        }
      }
      
      scores[intent] = score;
    }
    
    // Find the highest scoring intent
    const maxScore = Math.max(...Object.values(scores));
    
    if (maxScore > 0) {
      const topIntent = Object.keys(scores).find(intent => scores[intent] === maxScore);
      
      // If it's a summarize intent, detect the type using pattern matching
      let summarizationType = null;
      let summarizationLength = null;
      
      if (topIntent === 'summarize') {
        const lowerMessage = message.toLowerCase();
        
        // Detect summarization type
        if (lowerMessage.includes('tldr') || lowerMessage.includes('brief') || lowerMessage.includes('quick')) {
          summarizationType = 'tldr';
        } else if (lowerMessage.includes('key points') || lowerMessage.includes('main points') || 
                   lowerMessage.includes('bullet') || lowerMessage.includes('list')) {
          summarizationType = 'key-points';
        } else if (lowerMessage.includes('teaser') || lowerMessage.includes('preview') || 
                   lowerMessage.includes('hook') || lowerMessage.includes('intriguing')) {
          summarizationType = 'teaser';
        } else if (lowerMessage.includes('headline') || lowerMessage.includes('title') || 
                   lowerMessage.includes('one sentence')) {
          summarizationType = 'headline';
        } else {
          summarizationType = 'key-points'; // Default
        }
        
        // Detect length
        if (lowerMessage.includes('short') || lowerMessage.includes('brief') || lowerMessage.includes('quick')) {
          summarizationLength = 'short';
        } else if (lowerMessage.includes('long') || lowerMessage.includes('detailed') || lowerMessage.includes('comprehensive')) {
          summarizationLength = 'long';
        } else {
          summarizationLength = 'medium'; // Default
        }
      }
      
      return { 
        primary: topIntent, 
        confidence: Math.min(maxScore / 3, 1.0),
        secondary: [],
        reasoning: 'Pattern-based classification (fallback)',
        craftedPrompt: message,
        originalMessage: message,
        aiPowered: false,
        summarizationType: summarizationType,
        summarizationLength: summarizationLength
      };
    }
    
    return { 
      primary: 'research', 
      confidence: 0.5, 
      secondary: [],
      reasoning: 'Default classification (no clear pattern match)',
      craftedPrompt: message,
      originalMessage: message,
      aiPowered: false,
      summarizationType: null,
      summarizationLength: null
    };
  }

  // Extract displayable result from coordination response
  getDisplayableResult(coordinationResult) {
    if (!coordinationResult || !coordinationResult.results || coordinationResult.results.length === 0) {
      return 'No results available.';
    }
    
    // Get the primary result
    const primaryResult = coordinationResult.results.find(r => r.type === 'primary');
    if (primaryResult && primaryResult.result) {
      return primaryResult.result;
    }
    
    // Fallback to first result
    return coordinationResult.results[0].result || 'No result available.';
  }

  // Simplified method for chat interfaces - returns just the displayable result
  async processUserMessage(userMessage, pageContext = null) {
    try {
      const coordinationResult = await this.coordinateTask(userMessage, pageContext);
      return this.getDisplayableResult(coordinationResult);
    } catch (error) {
      console.error('Error processing user message:', error);
      return `Sorry, I encountered an error: ${error.message}`;
    }
  }

  // Coordinate and dispatch tasks to appropriate agents
  async coordinateTask(userMessage, pageContext = null) {
    try {
      console.log('Coordinating task for:', userMessage);

      // Step 1: Detect intent using AI
      const intentResult = await this.detectIntentWithAI(userMessage, pageContext);
      
      console.log('Intent detected:', intentResult);

      // Step 2: Dispatch to appropriate agent(s)
      const results = [];
      
      // Handle primary intent
      const primaryResult = await this.dispatchToAgent(intentResult.primary, intentResult.craftedPrompt, pageContext, intentResult);
      results.push({
        intent: intentResult.primary,
        type: 'primary',
        result: primaryResult
      });

      // Handle secondary intents if present
      if (intentResult.secondary && intentResult.secondary.length > 0) {
        for (const secondaryIntent of intentResult.secondary) {
          if (secondaryIntent !== intentResult.primary) {
            try {
              const secondaryResult = await this.dispatchToAgent(secondaryIntent, intentResult.craftedPrompt, pageContext, intentResult);
              results.push({
                intent: secondaryIntent,
                type: 'secondary',
                result: secondaryResult
              });
            } catch (error) {
              console.error(`Error handling secondary intent ${secondaryIntent}:`, error);
              results.push({
                intent: secondaryIntent,
                type: 'secondary',
                result: `Error processing ${secondaryIntent}: ${error.message}`
              });
            }
          }
        }
      }

      return {
        intentAnalysis: intentResult,
        results: results,
        success: true
      };

    } catch (error) {
      console.error('Error in task coordination:', error);
      throw new Error(`Task coordination failed: ${error.message}`);
    }
  }

  // Dispatch to specific agent based on intent
  async dispatchToAgent(intent, craftedPrompt, pageContext = null, intentAnalysis = null) {
    console.log(`Dispatching to ${intent} agent with prompt:`, craftedPrompt);

    switch (intent) {
      case 'summarize':
        // Check if user wants to summarize current page or provided text
        const isPageSummary = craftedPrompt.toLowerCase().includes('page') || 
                             craftedPrompt.toLowerCase().includes('this') || 
                             craftedPrompt.toLowerCase().includes('current');
        
        // Extract summarization preferences from intent analysis
        const summaryOptions = {};
        if (intentAnalysis) {
          if (intentAnalysis.summarizationType) {
            summaryOptions.type = intentAnalysis.summarizationType;
            console.log(`Using detected summarization type: ${intentAnalysis.summarizationType}`);
          }
          if (intentAnalysis.summarizationLength) {
            summaryOptions.length = intentAnalysis.summarizationLength;
            console.log(`Using detected summarization length: ${intentAnalysis.summarizationLength}`);
          }
        }
        
        if (isPageSummary && pageContext) {
          const pageResult = await this.summarizeCurrentPage();
          // Return formatted result with page context
          return `**${pageResult.title}**\n\n${pageResult.summary}\n\n*Source: ${pageResult.url}*\n*Word count: ${pageResult.wordCount}*`;
        } else {
          // For text summarization, extract text from the prompt
          const textMatch = craftedPrompt.match(/"([^"]+)"|'([^']+)'|summarize\s+(.+)$/i);
          const textToSummarize = textMatch ? (textMatch[1] || textMatch[2] || textMatch[3]) : craftedPrompt;
          return await this.summarizeText(textToSummarize, '', intentAnalysis);
        }

      case 'translate':
        // TODO: Implement translator agent dispatch
        return `Translation feature will be implemented with the Translator Agent. Request: "${craftedPrompt}"`;

      case 'write':
        // TODO: Implement writer agent dispatch
        return `Writing assistance feature will be implemented with the Writer Agent. Request: "${craftedPrompt}"`;

      case 'research':
        // Use the prompter itself for research queries
        return await this.handleResearchQuery(craftedPrompt, pageContext);

      default:
        throw new Error(`Unknown intent: ${intent}`);
    }
  }

  // Handle research queries using the prompter
  async handleResearchQuery(query, pageContext = null) {
    try {
      if (!this.prompter) {
        await this.createPrompter();
      }

      let contextualPrompt = query;
      
      // Add page context if available and relevant
      if (pageContext && (query.toLowerCase().includes('this page') || query.toLowerCase().includes('current page'))) {
        contextualPrompt = `Based on the current page "${pageContext.title}" (${pageContext.url}), ${query}
        
        ${pageContext.contentPreview ? `Page content: ${pageContext.contentPreview}` : ''}`;
      }

      // Create a research-focused system prompt
      const researchPrompt = `You are a helpful research assistant. Provide accurate, informative, and well-structured responses to user queries. If you don't know something, say so rather than guessing.

User query: ${contextualPrompt}

Please provide a comprehensive response:`;

      const response = await this.prompter.prompt(researchPrompt);
      return response;

    } catch (error) {
      console.error('Error handling research query:', error);
      throw new Error(`Research query failed: ${error.message}`);
    }
  }

  // Notify progress to UI
  notifyProgress(agentType, progress) {
    // Send message to popup/content script about download progress
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'AI_PROGRESS',
        agentType,
        progress
      }).catch(() => {
        // Ignore errors if popup is not open
      });
    }

    // Also dispatch custom event for content scripts
    window.dispatchEvent(new CustomEvent('agenwork-ai-progress', {
      detail: { agentType, progress }
    }));
  }

  // Destroy summarizer instance
  async destroySummarizer() {
    if (this.summarizer) {
      try {
        this.summarizer.destroy();
        this.summarizer = null;
        console.log('Summarizer destroyed');
      } catch (error) {
        console.error('Error destroying summarizer:', error);
      }
    }
  }

  // Comprehensive diagnostic function (Updated for Chrome 138+ Built-in AI)
  async getDiagnostics() {
    const chromeVersion = AIAgents.getChromeVersion();
    const support = AIAgents.isSupported();
    
    const diagnostics = {
      system: {
        userAgent: navigator.userAgent,
        chromeVersion: chromeVersion,
        chromeVersionValid: chromeVersion >= 138,
        platform: navigator.platform,
        memory: navigator.deviceMemory || 'Unknown'
      },
      browserSupport: support,
      aiAPIs: {
        windowAI: 'ai' in window,
        summarizer: support.windowAI && 'summarizer' in window.ai,
        languageModel: support.windowAI && 'languageModel' in window.ai,
        translator: support.windowAI && 'translator' in window.ai,
        writer: support.windowAI && 'writer' in window.ai
      },
      availability: {},
      recommendations: []
    };

    // Check specific API availability using Chrome Built-in AI pattern
    if (support.windowAI) {
      try {
        if (support.summarizer) {
          const summarizerCaps = await window.ai.summarizer.capabilities();
          diagnostics.availability.summarizer = summarizerCaps;
        }
      } catch (error) {
        diagnostics.availability.summarizerError = error.message;
      }

      try {
        if (support.prompter) {
          const languageModelCaps = await window.ai.languageModel.capabilities();
          diagnostics.availability.languageModel = languageModelCaps;
        }
      } catch (error) {
        diagnostics.availability.languageModelError = error.message;
      }
    }

    // Generate recommendations
    if (chromeVersion < 138) {
      diagnostics.recommendations.push('Update Chrome to version 138 or higher');
    }
    
    if (!support.windowAI) {
      diagnostics.recommendations.push('Enable Chrome Built-in AI flags or join the Origin Trial');
    }
    
    if (!support.summarizer && support.windowAI) {
      diagnostics.recommendations.push('The Summarizer API may not be available in your region or Chrome build');
    }

    if (!support.prompter && support.windowAI) {
      diagnostics.recommendations.push('The Language Model API may not be available in your region or Chrome build');
    }

    return diagnostics;
  }

  // Get capabilities and status of all AI agents
  async getCapabilities() {
    const support = AIAgents.isSupported();
    const capabilities = {
      summarizer: {
        supported: support.summarizer,
        available: false,
        ready: !!this.summarizer
      },
      translator: {
        supported: support.translator,
        available: false,
        ready: !!this.translator
      },
      writer: {
        supported: support.writer,
        available: false,
        ready: !!this.writer
      },
      prompter: {
        supported: support.prompter,
        available: false,
        ready: !!this.prompter
      }
    };

    // Check availability for each supported agent using correct API patterns
    try {
      if (support.summarizer) {
        const summarizerAvailability = await window.Summarizer.availability();
        console.log('Summarizer availability:', summarizerAvailability);
        capabilities.summarizer.available = summarizerAvailability === 'readily' || summarizerAvailability === 'after-download';
      }
    } catch (error) {
      console.warn('Error checking summarizer availability:', error);
    }

    try {
      if (support.translator) {
        const translatorAvailability = await window.Translator.availability();
        console.log('Translator availability:', translatorAvailability);
        capabilities.translator.available = translatorAvailability === 'readily' || translatorAvailability === 'after-download';
      }
    } catch (error) {
      console.warn('Error checking translator availability:', error);
    }

    try {
      if (support.writer) {
        const writerAvailability = await window.Writer.availability();
        console.log('Writer availability:', writerAvailability);
        capabilities.writer.available = writerAvailability === 'readily' || writerAvailability === 'after-download';
      }
    } catch (error) {
      console.warn('Error checking writer availability:', error);
    }

    try {
      if (support.prompter) {
        const availability = await window.LanguageModel.availability();
        console.log('LanguageModel availability:', availability);
        capabilities.prompter.available = availability === 'readily' || availability === 'after-download';
      }
    } catch (error) {
      console.warn('Error checking LanguageModel availability:', error);
    }

    return capabilities;
  }

  // Check if the current context supports AI APIs
  static async checkEnvironment() {
    const results = {
      chromeVersion: AIAgents.getChromeVersion(),
      isChromeVersionSupported: AIAgents.isChromeVersionSupported(),
      userActivation: navigator.userActivation ? navigator.userActivation.isActive : false,
      apis: {},
      recommendations: []
    };

    // Check each API
    const support = AIAgents.isSupported();
    
    if (support.summarizer) {
      try {
        const availability = await window.Summarizer.availability();
        results.apis.summarizer = { 
          supported: true, 
          availability,
          ready: availability === 'readily'
        };
      } catch (error) {
        results.apis.summarizer = { 
          supported: false, 
          error: error.message 
        };
      }
    } else {
      results.apis.summarizer = { supported: false };
    }

    if (support.prompter) {
      try {
        const availability = await window.LanguageModel.availability();
        results.apis.languageModel = { 
          supported: true, 
          availability,
          ready: availability === 'readily'
        };
      } catch (error) {
        results.apis.languageModel = { 
          supported: false, 
          error: error.message 
        };
      }
    } else {
      results.apis.languageModel = { supported: false };
    }

    // Generate recommendations
    if (!results.isChromeVersionSupported) {
      results.recommendations.push('Update Chrome to version 138 or later');
    }
    
    if (!results.userActivation) {
      results.recommendations.push('User interaction required - try clicking a button first');
    }

    const availableAPIs = Object.values(results.apis).filter(api => api.supported && api.ready).length;
    const supportedAPIs = Object.values(results.apis).filter(api => api.supported).length;
    
    if (availableAPIs === 0 && supportedAPIs > 0) {
      results.recommendations.push('AI models may need to be downloaded - this requires user interaction');
      results.recommendations.push('Check chrome://on-device-internals for model status');
    }

    return results;
  }

  // Notify UI of AI model download progress
  notifyProgress(agentType, progress) {
    console.log(`${agentType} download progress: ${progress.toFixed(1)}%`);
    
    // Send progress to background script if available
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({
          type: 'AI_PROGRESS',
          agentType: agentType,
          progress: progress
        });
      } catch (error) {
        console.warn('Could not send progress to background script:', error);
      }
    }
    
    // Dispatch custom event for local listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-progress', {
        detail: { agentType, progress }
      }));
    }
  }

  // Debug method to check all AI capabilities
  async debugCapabilities() {
    console.log('=== AI Capabilities Debug ===');
    
    const support = AIAgents.isSupported();
    console.log('Support Check Results:', support);
    
    const capabilities = await this.getCapabilities();
    console.log('Capabilities Check Results:', capabilities);
    
    // Test each API individually using correct global object patterns
    if (support.summarizer) {
      console.log('Summarizer API found as global object');
      try {
        const summarizerAvail = await window.Summarizer.availability();
        console.log('Summarizer availability:', summarizerAvail);
      } catch (e) {
        console.error('Summarizer availability error:', e);
      }
    }
    
    if (support.translator) {
      console.log('Translator API found as global object');
      try {
        const translatorAvail = await window.Translator.availability();
        console.log('Translator availability:', translatorAvail);
      } catch (e) {
        console.error('Translator availability error:', e);
      }
    }
    
    if (support.writer) {
      console.log('Writer API found as global object');
      try {
        const writerAvail = await window.Writer.availability();
        console.log('Writer availability:', writerAvail);
      } catch (e) {
        console.error('Writer availability error:', e);
      }
    }
    
    if (support.prompter) {
      console.log('LanguageModel API found as global object');
      try {
        const prompterAvail = await window.LanguageModel.availability();
        console.log('LanguageModel availability:', prompterAvail);
      } catch (e) {
        console.error('LanguageModel availability error:', e);
      }
    }
    
    if (!support.summarizer && !support.translator && !support.writer && !support.prompter) {
      console.log('No AI APIs available as global objects');
      console.log('Available global objects:', Object.getOwnPropertyNames(window).filter(name => name.includes('AI') || name.includes('Model') || name.includes('Summarizer') || name.includes('Translator') || name.includes('Writer')));
    }
    
    console.log('=== End Debug ===');
    return { support, capabilities };
  }

  // Cleanup method
  async cleanup() {
    await this.destroySummarizer();
    // Add cleanup for other agents when implemented
    this.initialized = false;
    console.log('AI Agents cleaned up');
  }
}

// Standalone function for page content extraction (used with chrome.scripting.executeScript)
function extractPageContentFunction() {
  try {
    // Get main content areas (don't remove scripts as this could break the page)
    const contentSelectors = [
      'main',
      'article', 
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '#content',
      '#main-content',
      '.article-content',
      '.blog-content',
      '.text-content'
    ];

    let content = '';
    let title = document.title || '';
    let url = window.location.href || '';

    // Try to find main content area
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = element.innerText || element.textContent || '';
        if (content.trim().length > 200) {
          break;
        }
      }
    }

    // If no main content found, try to get meaningful content from body
    if (!content || content.trim().length < 200) {
      // Try to get content excluding navigation, headers, footers, etc.
      const elementsToExclude = 'nav, header, footer, aside, .navigation, .menu, .sidebar, .ad, .advertisement, script, style, noscript, .comments';
      const bodyClone = document.body.cloneNode(true);
      
      // Remove excluded elements
      bodyClone.querySelectorAll(elementsToExclude).forEach(el => el.remove());
      
      content = bodyClone.innerText || bodyClone.textContent || '';
    }

    // If still no content, fallback to full body
    if (!content || content.trim().length < 100) {
      content = document.body.innerText || document.body.textContent || '';
    }

    // Clean up the content
    content = content
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive newlines
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .trim();

    // Limit content length to prevent issues with very long pages
    if (content.length > 50000) {
      content = content.substring(0, 50000) + '...';
    }

    return {
      title,
      url,
      content,
      timestamp: new Date().toISOString(),
      wordCount: content.split(/\s+/).filter(word => word.length > 0).length
    };

  } catch (error) {
    console.error('Error extracting page content:', error);
    return {
      title: document.title || 'Unknown',
      url: window.location.href || '',
      content: '',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAgents;
} else {
  window.AIAgents = AIAgents;
  
  // Add global debug functions
  window.debugAI = async function() {
    console.log('=== Global AI Debug ===');
    if (window.aiAgents) {
      return await window.aiAgents.debugCapabilities();
    } else {
      console.log('aiAgents not initialized. Creating temporary instance...');
      const tempAgents = new AIAgents();
      await tempAgents.initialize();
      return await tempAgents.debugCapabilities();
    }
  };

  // Quick environment check
  window.checkAIEnvironment = async function() {
    console.log('=== AI Environment Check ===');
    const results = await AIAgents.checkEnvironment();
    console.log('Results:', results);
    
    if (results.recommendations.length > 0) {
      console.log('Recommendations:');
      results.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    return results;
  };

  // Test API creation directly
  window.testAICreation = async function() {
    console.log('=== Testing AI API Creation ===');
    
    try {
      console.log('Testing Summarizer creation...');
      const summarizer = await window.Summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: 'short',
        outputLanguage: 'en'
      });
      console.log('✓ Summarizer created successfully');
      
      // Test summarization
      const testSummary = await summarizer.summarize('This is a test text for summarization. It contains multiple sentences to test the API functionality.');
      console.log('✓ Summarization test:', testSummary);
      
    } catch (error) {
      console.error('✗ Summarizer creation failed:', error);
    }

    try {
      console.log('Testing LanguageModel creation...');
      const model = await window.LanguageModel.create();
      console.log('✓ LanguageModel created successfully');
      
      // Test prompting
      const testResponse = await model.prompt('Say hello!');
      console.log('✓ Prompting test:', testResponse);
      
    } catch (error) {
      console.error('✗ LanguageModel creation failed:', error);
    }
  };
}
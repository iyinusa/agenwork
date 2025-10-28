// AI Agents Module for AgenWork
// Handles all Chrome Built-in AI API interactions

class AIAgents {
  constructor() {
    this.summarizer = null;
    this.translator = null;
    this.writer = null;
    this.prompter = null;
    this.initialized = false;
  }

  // Initialize the AI Agents system
  async initialize() {
    try {
      console.log('Initializing AI Agents...');
      
      // Check if LanguageModel is available (like the working demo)
      if (!('LanguageModel' in self) && !('LanguageModel' in window)) {
        console.log('LanguageModel not available in global scope');
      } else {
        console.log('LanguageModel found in global scope');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize AI Agents:', error);
      this.initialized = false;
      return false;
    }
  }

  // Check if browser supports AI APIs
  static isSupported() {
    const hasWindow = typeof window !== 'undefined';
    const hasAI = hasWindow && 'ai' in window;
    
    // Check for Summarizer API as per Chrome documentation
    const hasSummarizer = hasWindow && ('Summarizer' in self || (hasAI && 'summarizer' in window.ai));
    
    // More detailed checks for each AI agent type
    const hasTranslator = hasAI && 'translator' in window.ai;
    const hasWriter = hasAI && 'writer' in window.ai;
    // Check for LanguageModel in global scope (correct API path)
    const hasPrompter = hasWindow && ('LanguageModel' in self || 'LanguageModel' in window);
    
    console.log('AI Support Check:', {
      hasWindow,
      hasAI,
      hasSummarizer,
      hasTranslator,
      hasWriter,
      hasPrompter,
      summarizerInSelf: hasWindow && 'Summarizer' in self,
      windowAISummarizer: hasAI && 'summarizer' in window.ai,
      windowAITranslator: hasAI && 'translator' in window.ai,
      windowAIWriter: hasAI && 'writer' in window.ai,
      languageModelInSelf: hasWindow && 'LanguageModel' in self,
      languageModelInWindow: hasWindow && 'LanguageModel' in window,
      globalSummarizer: hasWindow && typeof window.Summarizer !== 'undefined',
      globalLanguageModel: hasWindow && typeof window.LanguageModel !== 'undefined',
      userAgent: hasWindow ? navigator.userAgent : 'N/A',
      chromeVersion: hasWindow ? this.getChromeVersion() : 'N/A'
    });
    
    return {
      summarizer: hasSummarizer,
      translator: hasTranslator,
      writer: hasWriter,
      prompter: hasPrompter,
      windowAI: hasAI,
      hasWindow: hasWindow
    };
  }

  // Get Chrome version for debugging
  static getChromeVersion() {
    if (typeof navigator === 'undefined') return null;
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  // Summarizer Agent Implementation
  async createSummarizer(options = {}) {
    try {
      // Enhanced availability check with detailed logging
      console.log('Checking Summarizer API availability...');
      
      const support = AIAgents.isSupported();
      console.log('Browser support check:', support);
      
      if (!support.hasWindow) {
        throw new Error('Window object not available - running outside browser context');
      }
      
      if (!support.windowAI) {
        const chromeVersion = AIAgents.getChromeVersion();
        throw new Error(`Chrome Built-in AI API not available. Current Chrome version: ${chromeVersion || 'Unknown'}. Required: Chrome 128+ with AI features enabled.`);
      }
      
      if (!support.summarizer) {
        throw new Error('Summarizer API is not available in this browser. Please ensure you have Chrome 128+ and the Built-in AI APIs are enabled.');
      }

      // Check availability using the correct API pattern
      let availability;
      if ('Summarizer' in self) {
        availability = await self.Summarizer.availability();
      } else if (typeof window.Summarizer !== 'undefined') {
        availability = await window.Summarizer.availability();
      } else if (window.ai && window.ai.summarizer) {
        availability = await window.ai.summarizer.availability();
      } else {
        throw new Error('Summarizer API not found in expected locations');
      }
      console.log('Summarizer availability:', availability);

      if (availability.available === 'no') {
        throw new Error('Summarizer API is not available on this device. Please check system requirements (Chrome 128+, 16GB RAM, 22GB storage). You may also need to enable Chrome flags or join the Origin Trial.');
      }

      if (availability.available === 'after-download') {
        console.log('Summarizer model needs to be downloaded first');
      }

      // Default options for summarizer
      const defaultOptions = {
        type: 'key-points', // 'key-points', 'tldr', 'teaser', 'headline'
        format: 'markdown', // 'markdown', 'plain-text'
        length: 'medium', // 'short', 'medium', 'long'
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

      // Check for user activation requirement
      if (!navigator.userActivation || !navigator.userActivation.isActive) {
        console.warn('User activation required for Summarizer API');
      }

      console.log('Creating summarizer with options:', finalOptions);
      
      // Create summarizer using the correct API pattern
      if ('Summarizer' in self) {
        this.summarizer = await self.Summarizer.create(finalOptions);
      } else if (typeof window.Summarizer !== 'undefined') {
        this.summarizer = await window.Summarizer.create(finalOptions);
      } else if (window.ai && window.ai.summarizer) {
        this.summarizer = await window.ai.summarizer.create(finalOptions);
      } else {
        throw new Error('Summarizer API not available for creation');
      }
      
      console.log('Summarizer created successfully');
      return this.summarizer;

    } catch (error) {
      console.error('Error creating summarizer:', error);
      throw new Error(`Failed to create summarizer: ${error.message}`);
    }
  }

  // Summarize text content
  async summarizeText(text, context = '', streaming = false) {
    try {
      if (!this.summarizer) {
        await this.createSummarizer();
      }

      if (!text || text.trim().length === 0) {
        throw new Error('No text provided for summarization');
      }

      // Clean text (remove HTML tags, excessive whitespace)
      const cleanText = this.cleanTextForSummarization(text);
      
      if (cleanText.length < 50) {
        return 'The provided text is too short to summarize effectively.';
      }

      console.log(`Summarizing text (${cleanText.length} characters)...`);

      const options = context ? { context } : {};

      if (streaming) {
        return this.summarizer.summarizeStreaming(cleanText, options);
      } else {
        const summary = await this.summarizer.summarize(cleanText, options);
        console.log('Summary generated successfully');
        return summary;
      }

    } catch (error) {
      console.error('Error during summarization:', error);
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
      const summary = await this.summarizeText(pageData.content, context);

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
            const summary = await this.summarizeText(response.content.content, context);
            
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

  // Prompter Agent Implementation (Coordinator Agent using Chrome Prompt AI)
  async createPrompter(options = {}) {
    try {
      console.log('Checking Prompt API (LanguageModel) availability...');
      
      const support = AIAgents.isSupported();
      console.log('Browser support check:', support);
      
      if (!support.hasWindow) {
        throw new Error('Window object not available - running outside browser context');
      }
      
      if (!support.windowAI) {
        const chromeVersion = AIAgents.getChromeVersion();
        throw new Error(`Chrome Built-in AI API not available. Current Chrome version: ${chromeVersion || 'Unknown'}. Required: Chrome 128+ with AI features enabled.`);
      }
      
      if (!support.prompter) {
        throw new Error('Prompt API (LanguageModel) is not available in this browser. Please ensure you have Chrome 128+ and the Built-in AI APIs are enabled.');
      }

      // Check availability using the correct API pattern
      let availability;
      if ('LanguageModel' in self) {
        availability = await self.LanguageModel.availability();
      } else if ('LanguageModel' in window) {
        availability = await window.LanguageModel.availability();
      } else {
        throw new Error('LanguageModel API not found. Make sure Chrome Built-in AI is enabled.');
      }
      
      console.log('LanguageModel availability:', availability);

      if (availability === 'no') {
        throw new Error('LanguageModel API is not available on this device. Please check system requirements (Chrome 128+, 16GB RAM, 22GB storage, 4GB+ VRAM or 4+ CPU cores). You may also need to enable Chrome flags or join the Origin Trial.');
      }

      if (availability === 'after-download') {
        console.log('Gemini Nano model needs to be downloaded first');
      }

      // Get model parameters like the working demo
      let modelParams;
      try {
        if ('LanguageModel' in self) {
          modelParams = await self.LanguageModel.params();
        } else if ('LanguageModel' in window) {
          modelParams = await window.LanguageModel.params();
        }
        console.log('LanguageModel params:', modelParams);
      } catch (error) {
        console.warn('Could not get LanguageModel params, using defaults:', error);
        modelParams = {defaultTopK: 3, maxTopK: 128, defaultTemperature: 1, maxTemperature: 2};
      }

      // Default options for prompter (based on working demo)
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

      // Check for user activation requirement
      if (!navigator.userActivation || !navigator.userActivation.isActive) {
        console.warn('User activation required for LanguageModel API');
      }

      console.log('Creating LanguageModel session with options:', finalOptions);
      
      // Create language model session using the correct API pattern
      if ('LanguageModel' in self) {
        this.prompter = await self.LanguageModel.create(finalOptions);
      } else if ('LanguageModel' in window) {
        this.prompter = await window.LanguageModel.create(finalOptions);
      } else {
        throw new Error('LanguageModel API not available for creation');
      }
      
      console.log('Prompter (LanguageModel) created successfully');
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

RESPONSE FORMAT:
Respond with a JSON object containing:
{
  "primary": "intent_name",
  "confidence": 0.0-1.0,
  "secondary": ["intent_name1", "intent_name2"] or null,
  "reasoning": "brief explanation of why this intent was chosen",
  "crafted_prompt": "an enhanced version of the user message optimized for the target agent"
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

      // Get AI classification with structured output
      const response = await this.prompter.prompt(fullPrompt, {
        responseConstraint: {
          type: "object",
          properties: {
            primary: { type: "string", enum: ["summarize", "translate", "write", "research"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            secondary: { 
              type: "array", 
              items: { type: "string", enum: ["summarize", "translate", "write", "research"] },
              nullable: true
            },
            reasoning: { type: "string" },
            crafted_prompt: { type: "string" }
          },
          required: ["primary", "confidence", "reasoning", "crafted_prompt"]
        }
      });

      const result = JSON.parse(response);
      console.log('AI Intent Detection Result:', result);

      return {
        primary: result.primary,
        confidence: result.confidence,
        secondary: result.secondary || [],
        reasoning: result.reasoning,
        craftedPrompt: result.crafted_prompt,
        originalMessage: userMessage,
        aiPowered: true
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
      return { 
        primary: topIntent, 
        confidence: Math.min(maxScore / 3, 1.0),
        secondary: [],
        reasoning: 'Pattern-based classification (fallback)',
        craftedPrompt: message,
        originalMessage: message,
        aiPowered: false
      };
    }
    
    return { 
      primary: 'research', 
      confidence: 0.5, 
      secondary: [],
      reasoning: 'Default classification (no clear pattern match)',
      craftedPrompt: message,
      originalMessage: message,
      aiPowered: false
    };
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
      const primaryResult = await this.dispatchToAgent(intentResult.primary, intentResult.craftedPrompt, pageContext);
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
              const secondaryResult = await this.dispatchToAgent(secondaryIntent, intentResult.craftedPrompt, pageContext);
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
  async dispatchToAgent(intent, craftedPrompt, pageContext = null) {
    console.log(`Dispatching to ${intent} agent with prompt:`, craftedPrompt);

    switch (intent) {
      case 'summarize':
        // Check if user wants to summarize current page or provided text
        const isPageSummary = craftedPrompt.toLowerCase().includes('page') || 
                             craftedPrompt.toLowerCase().includes('this') || 
                             craftedPrompt.toLowerCase().includes('current');
        
        if (isPageSummary && pageContext) {
          return await this.summarizeCurrentPage();
        } else {
          // For text summarization, extract text from the prompt
          const textMatch = craftedPrompt.match(/"([^"]+)"|'([^']+)'|summarize\s+(.+)$/i);
          const textToSummarize = textMatch ? (textMatch[1] || textMatch[2] || textMatch[3]) : craftedPrompt;
          return await this.summarizeText(textToSummarize);
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

  // Comprehensive diagnostic function
  async getDiagnostics() {
    const chromeVersion = AIAgents.getChromeVersion();
    const support = AIAgents.isSupported();
    
    const diagnostics = {
      system: {
        userAgent: navigator.userAgent,
        chromeVersion: chromeVersion,
        chromeVersionValid: chromeVersion >= 128,
        platform: navigator.platform,
        memory: navigator.deviceMemory || 'Unknown'
      },
      browserSupport: support,
      aiAPIs: {
        windowAI: 'ai' in window,
        summarizer: support.windowAI && 'summarizer' in window.ai,
        translator: support.windowAI && 'translator' in window.ai,
        writer: support.windowAI && 'writer' in window.ai,
        languageModel: support.windowAI && 'languageModel' in window.ai
      },
      availability: {},
      recommendations: []
    };

    // Check specific API availability
    if (support.windowAI) {
      try {
        if (support.summarizer) {
          const summarizerCaps = await window.ai.summarizer.capabilities();
          diagnostics.availability.summarizer = summarizerCaps;
        }
      } catch (error) {
        diagnostics.availability.summarizerError = error.message;
      }
    }

    // Generate recommendations
    if (chromeVersion < 128) {
      diagnostics.recommendations.push('Update Chrome to version 128 or higher');
    }
    
    if (!support.windowAI) {
      diagnostics.recommendations.push('Enable Chrome Built-in AI flags or join the Origin Trial');
    }
    
    if (!support.summarizer && support.windowAI) {
      diagnostics.recommendations.push('The Summarizer API may not be available in your region or Chrome build');
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

    // Check availability for each supported agent
    try {
      if (support.summarizer) {
        const summarizerCaps = await window.ai.summarizer.capabilities();
        console.log('Summarizer capabilities:', summarizerCaps);
        capabilities.summarizer.available = summarizerCaps.available === 'readily' || summarizerCaps.available === 'after-download';
      }
    } catch (error) {
      console.warn('Error checking summarizer capabilities:', error);
    }

    try {
      if (support.translator) {
        const translatorAvailability = await window.ai.translator.availability();
        console.log('Translator availability:', translatorAvailability);
        capabilities.translator.available = translatorAvailability === 'readily' || translatorAvailability === 'after-download';
      }
    } catch (error) {
      console.warn('Error checking translator capabilities:', error);
    }

    try {
      if (support.writer) {
        const writerAvailability = await window.ai.writer.availability();
        console.log('Writer availability:', writerAvailability);
        capabilities.writer.available = writerAvailability === 'readily' || writerAvailability === 'after-download';
      }
    } catch (error) {
      console.warn('Error checking writer capabilities:', error);
    }

    try {
      if (support.prompter) {
        let availability;
        if ('LanguageModel' in self) {
          availability = await self.LanguageModel.availability();
        } else if ('LanguageModel' in window) {
          availability = await window.LanguageModel.availability();
        }
        console.log('Prompter availability:', availability);
        capabilities.prompter.available = availability === 'readily' || availability === 'after-download';
      }
    } catch (error) {
      console.warn('Error checking prompter capabilities:', error);
    }

    return capabilities;
  }

  // Debug method to check all AI capabilities
  async debugCapabilities() {
    console.log('=== AI Capabilities Debug ===');
    
    const support = AIAgents.isSupported();
    console.log('Support Check Results:', support);
    
    const capabilities = await this.getCapabilities();
    console.log('Capabilities Check Results:', capabilities);
    
    // Test each API individually
    if (support.windowAI) {
      console.log('window.ai object:', window.ai);
      
      if (window.ai.summarizer) {
        console.log('Summarizer API found');
        try {
          const summarizerCaps = await window.ai.summarizer.capabilities();
          console.log('Summarizer capabilities:', summarizerCaps);
        } catch (e) {
          console.error('Summarizer capabilities error:', e);
        }
      }
      
      if (window.ai.translator) {
        console.log('Translator API found');
        try {
          const translatorAvail = await window.ai.translator.availability();
          console.log('Translator availability:', translatorAvail);
        } catch (e) {
          console.error('Translator availability error:', e);
        }
      }
      
      if (window.ai.writer) {
        console.log('Writer API found');
        try {
          const writerAvail = await window.ai.writer.availability();
          console.log('Writer availability:', writerAvail);
        } catch (e) {
          console.error('Writer availability error:', e);
        }
      }
      
      if ('LanguageModel' in self || 'LanguageModel' in window) {
        console.log('LanguageModel API found');
        try {
          let prompterAvail;
          if ('LanguageModel' in self) {
            prompterAvail = await self.LanguageModel.availability();
          } else {
            prompterAvail = await window.LanguageModel.availability();
          }
          console.log('LanguageModel availability:', prompterAvail);
        } catch (e) {
          console.error('LanguageModel availability error:', e);
        }
      }
    } else {
      console.log('window.ai not available');
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
  
  // Add global debug function
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
}
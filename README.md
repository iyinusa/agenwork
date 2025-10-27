# AgenWork

AgenWork is a smart browsing agent browser extension that helps user with instant answers, smarter suggestions, and tasks using Chrome's built-in AI APIs.

## 🚀 Features

- **Conversation Interface**: Clean and intuitive chat interface for interacting with AI agents
- **Floating Icon**: Toggleable floating button that can be positioned anywhere on the page
- **Multiple AI Agents**: Support for Summarizer, Translator, Writer, and Prompter agents
- **Offline Storage**: All conversations and settings stored locally using DexieJS
- **Privacy First**: Uses Chrome's built-in AI APIs for client-side processing
- **Intelligent Intent Detection**: Automatically routes requests to appropriate AI agents

## 🤖 AI Agents Implemented

### ✅ Summarizer Agent (COMPLETED)
- **Status**: Fully implemented and ready for testing
- **Features**:
  - Summarize current web page content
  - Summarize user-provided text
  - Multiple summary types (key-points, tldr, teaser, headline)
  - Configurable length (short, medium, long)
  - Real-time progress feedback during model download
  - Intelligent content extraction from web pages

### 🚧 Other Agents (Planned)
- **Translator Agent**: Real-time translation capabilities
- **Writer Agent**: Writing assistance and composition help
- **Prompter Agent**: General AI-powered conversations

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd agenwork
   ```

2. **Load extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the project folder
   - The AgenWork extension should now be installed

3. **Verify Chrome AI API Support**:
   - Ensure you're using Chrome 128+ 
   - Check `chrome://flags/#optimization-guide-on-device-model` is enabled
   - Visit `chrome://on-device-internals` to verify AI model availability

## 🧪 Testing the Summarizer Agent

### Quick Test:
1. Open the included `test-page.html` file in Chrome
2. Click the AgenWork extension icon
3. Click the "Summarize Page" quick action button
4. Watch as the AI extracts and summarizes the page content!

### Manual Testing:
1. Navigate to any article or content-rich webpage
2. Open AgenWork popup
3. Try these commands:
   - "Summarize this page"
   - "Give me a summary of this article"
   - "What are the key points on this page?"
   - "tldr this content"

### Expected Behavior:
- ✅ Extension detects summarization intent
- ✅ Extracts meaningful content from the page
- ✅ Shows progress during first-time model download
- ✅ Generates intelligent summary using Chrome's Summarizer API
- ✅ Displays formatted summary with page metadata

## 🔧 System Requirements

### For Full AI Functionality:
- **Chrome Version**: 128+ (Summarizer API available)
- **Operating System**: 
  - Windows 10 or 11
  - macOS 13+ (Ventura and onwards)
  - Linux
  - ChromeOS (Chromebook Plus devices)
- **Hardware**:
  - **RAM**: 16GB or more
  - **Storage**: 22GB free space (for AI models)
  - **GPU**: 4GB+ VRAM (recommended) or powerful CPU

### For Basic Functionality:
- Chrome 88+ (extension works with limited features)
- Basic system requirements

## 🎯 Architecture Overview

```
AgenWork/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI interface
├── js/
│   ├── popup.js          # Main popup logic & AI integration
│   ├── ai-agents.js      # AI Agents implementation
│   ├── background.js     # Service worker
│   ├── content.js        # Content script
│   ├── database.js       # DexieJS database layer
│   └── floating-icon.js  # Floating button functionality
├── css/
│   └── popup.css         # Styling
└── test-page.html        # Test page for summarization
```

## 🔍 Key Implementation Details

### Summarizer Agent Implementation:
- **File**: `js/ai-agents.js`
- **API Used**: Chrome's `window.ai.summarizer` API
- **Features**:
  - Capability detection and error handling
  - Progress monitoring during model download
  - Content extraction and cleaning
  - Multiple summary formats and lengths
  - Context-aware summarization

### Intent Detection:
- **File**: `js/popup.js` (detectIntent function)
- **Method**: Pattern matching and keyword scoring
- **Supported Intents**: Summarize, Translate, Write, Research, General

### Error Handling:
- Graceful degradation when AI APIs unavailable
- User-friendly error messages
- Fallback functionality for unsupported browsers

## 🚨 Known Limitations

1. **AI Model Download**: First use requires downloading ~22GB AI model
2. **Browser Support**: Limited to Chrome 128+ for full functionality
3. **Hardware Requirements**: Significant resource requirements for AI features
4. **Content Extraction**: May not work perfectly on all website layouts

## 🛣️ Next Steps (Backlog Implementation)

1. **Implement remaining AI agents** (Translator, Writer, Prompter)
2. **Enhanced intent detection** using Prompter agent with Gemini Nano
3. **Multi-intent handling** for complex user requests
4. **Streaming responses** for real-time AI output
5. **Advanced conversation management** with context preservation

## 🐛 Troubleshooting

### AI APIs Not Working:
1. Check Chrome version: `chrome://version/`
2. Enable AI features: `chrome://flags/#optimization-guide-on-device-model`
3. Check model status: `chrome://on-device-internals`
4. Ensure sufficient storage space

### Extension Not Loading:
1. Check for errors in `chrome://extensions/`
2. Reload the extension
3. Check browser console for error messages

## 📝 Development Notes

This implementation focuses on the **Summarizer Agent** as requested in backlog item 4, providing:
- Complete Chrome Summarizer API integration
- Robust error handling and user feedback
- Intelligent content extraction
- Progress tracking and status updates
- Comprehensive testing capabilities

The architecture is designed for easy extension to support the remaining AI agents using similar patterns.

## 📄 License

GNU GENERAL PUBLIC LICENSE - see LICENSE file for details.
